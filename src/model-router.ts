/**
 * Model Router - Intelligent Multi-Cloud Provider Selection
 *
 * Routes API calls to the optimal provider based on:
 * - Task complexity
 * - Cost constraints
 * - Quality requirements
 * - Provider availability
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextBridge } from './context-bridge/index.js';
import {
  estimateUsdCost,
  normalizeTokenUsage,
  pricingFromUsdPerMillion,
  type Pricing,
  type TokenUsageNormalized
} from './costing/tokentally.js';
import {
  CostEntry,
  SessionCosts,
  Provider,
  QualityTier,
  ModelRouterConfig,
  RoutedModelConfig,
  ModelCatalogStatus
} from './types.js';
import { computeSpentThisMonthFromContext, getMonthlyBudget } from './budget.js';

export interface RoutingDecision {
  provider: Provider;
  model: string;
  modelKey: string;
  quality: QualityTier;
  rationale: string;
  estimatedCost: number;
  fallbacks: {
    provider: Provider;
    model: string;
    modelKey: string;
    quality: QualityTier;
    estimatedCost: number;
  }[];
}

interface RoutingCandidate {
  config: RoutedModelConfig;
  estimatedCost: number;
}

interface InvokeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

const DEFAULT_PROVIDER_PREFERENCE: Provider[] = ['anthropic', 'openai', 'gemini', 'openrouter'];

const DEFAULT_MODEL_CATALOG: ModelRouterConfig = {
  providerPreference: DEFAULT_PROVIDER_PREFERENCE,
  models: [
    {
      key: 'haiku',
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      quality: 'fast',
      costPerMTokIn: 0.8,
      costPerMTokOut: 4.0
    },
    {
      key: 'sonnet',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      quality: 'balanced',
      costPerMTokIn: 3.0,
      costPerMTokOut: 15.0
    },
    {
      key: 'opus',
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
      quality: 'quality',
      costPerMTokIn: 15.0,
      costPerMTokOut: 75.0
    },
    {
      key: 'gpt-4',
      provider: 'openai',
      model: 'gpt-4-turbo',
      quality: 'quality',
      costPerMTokIn: 10.0,
      costPerMTokOut: 30.0
    },
    {
      key: 'gpt-4-turbo',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      quality: 'balanced',
      costPerMTokIn: 10.0,
      costPerMTokOut: 30.0
    },
    {
      key: 'gemini-pro',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      quality: 'balanced',
      costPerMTokIn: 10.0,
      costPerMTokOut: 30.0
    }
  ]
};

export class ModelRouter {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private budgetRemaining: number;
  private enableCostOptimization: boolean;
  private costEntries: CostEntry[] = [];
  private sessionId: string | null = null;
  private catalog: ModelRouterConfig | null = null;
  private catalogLoaded = false;
  private catalogStatus: ModelCatalogStatus | null = null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const monthlyBudget = getMonthlyBudget();
    const spentThisMonth = computeSpentThisMonthFromContext();
    this.budgetRemaining = monthlyBudget - spentThisMonth;
    this.enableCostOptimization = process.env.ENABLE_COST_OPTIMIZATION !== 'false';
  }

  /**
   * Set the current session ID for cost tracking
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Clear cached catalog so the next call reloads context overrides.
   */
  refreshCatalog(): void {
    this.catalog = null;
    this.catalogStatus = null;
    this.catalogLoaded = false;
  }

  /**
   * Return the active model catalog (with overrides applied).
   */
  async getCatalog(): Promise<ModelRouterConfig> {
    return this.loadCatalog();
  }

  /**
   * Route a request to the optimal model provider
   */
  async routeRequest(
    prompt: string,
    task: string,
    options?: {
      model?: string;
      minQuality?: QualityTier;
      maxCost?: number;
    }
  ): Promise<RoutingDecision> {
    const minQuality = options?.minQuality || 'balanced';
    const maxCost = options?.maxCost;
    const preferredModel = options?.model;

    const estimatedInputTokens = Math.ceil(prompt.length / 4); // Rough estimate
    const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.5); // Conservative estimate

    const catalog = await this.loadCatalog();
    const providerPreference = catalog.providerPreference?.length
      ? catalog.providerPreference
      : DEFAULT_PROVIDER_PREFERENCE;

    let candidates = this.buildCandidates(
      catalog.models,
      estimatedInputTokens,
      estimatedOutputTokens
    );

    const notes: string[] = [];

    const availableCandidates = candidates.filter(candidate =>
      this.isProviderAvailable(candidate.config.provider)
    );
    if (availableCandidates.length > 0) {
      candidates = availableCandidates;
    } else {
      notes.push('No provider API keys found; using configured models anyway.');
    }

    if (preferredModel) {
      const pinnedCandidates = candidates.filter(
        candidate => candidate.config.key === preferredModel
      );
      if (pinnedCandidates.length > 0) {
        candidates = pinnedCandidates;
      } else {
        notes.push(`Preferred model "${preferredModel}" not found; using available models.`);
      }
    }

    const minQualityRank = this.qualityRank(minQuality);
    const qualityCandidates = candidates.filter(
      candidate => this.qualityRank(candidate.config.quality) >= minQualityRank
    );
    if (qualityCandidates.length > 0) {
      candidates = qualityCandidates;
    } else {
      notes.push(`No models meet minQuality "${minQuality}"; using available models.`);
    }

    if (maxCost !== undefined) {
      const maxCostCandidates = candidates.filter(
        candidate => candidate.estimatedCost <= maxCost
      );
      if (maxCostCandidates.length > 0) {
        candidates = maxCostCandidates;
      } else {
        notes.push(`No models meet maxCost $${maxCost.toFixed(6)}; using available models.`);
      }
    }

    const status = this.catalogStatus;
    if (this.shouldPreferFrontier(task)) {
      if (status?.status === 'fresh' && status.criticalOk) {
        const criticalKeys = new Set(status.criticalKeys);
        const frontierCandidates = candidates.filter(candidate => criticalKeys.has(candidate.config.key));
        if (frontierCandidates.length > 0) {
          candidates = frontierCandidates;
          notes.push('Frontier-only routing applied for critical task.');
        } else {
          notes.push('No frontier candidates available; using all models.');
        }
      } else if (status) {
        notes.push('Model freshness is stale; frontier routing skipped.');
      } else {
        notes.push('Model freshness status missing; frontier routing skipped.');
      }
    }

    if (candidates.length === 0) {
      candidates = this.buildCandidates(
        DEFAULT_MODEL_CATALOG.models,
        estimatedInputTokens,
        estimatedOutputTokens
      );
      notes.push('No candidates available after filtering; using fallback catalog.');
    }

    const sortedCandidates = this.sortCandidates(candidates, providerPreference);
    const fallbacks = sortedCandidates.length > 0
      ? this.buildFallbacks(sortedCandidates, sortedCandidates[0])
      : [];

    const constraints = [`minQuality=${minQuality}`];
    if (maxCost !== undefined) {
      constraints.push(`maxCost=$${maxCost.toFixed(6)}`);
    }
    if (preferredModel) {
      constraints.push(`preferredModel=${preferredModel}`);
    }

    if (!this.enableCostOptimization) {
      const chosen = sortedCandidates[0];
      if (!chosen) {
        throw new Error('No models available for routing.');
      }
      return {
        provider: chosen.config.provider,
        model: chosen.config.model,
        modelKey: chosen.config.key,
        quality: chosen.config.quality,
        rationale: this.buildRationale(
          `Cost optimization disabled; selected ${chosen.config.key} for task "${task}".`,
          constraints,
          notes
        ),
        estimatedCost: chosen.estimatedCost,
        fallbacks
      };
    }

    const withinBudget = sortedCandidates.filter(
      candidate => candidate.estimatedCost <= this.budgetRemaining
    );
    const chosen = withinBudget[0] || sortedCandidates[0];
    if (!chosen) {
      throw new Error('No models available for routing.');
    }
    if (withinBudget.length === 0) {
      notes.push(
        `Estimated cost $${chosen.estimatedCost.toFixed(6)} exceeds remaining $${this.budgetRemaining.toFixed(6)}.`
      );
    }

    return {
      provider: chosen.config.provider,
      model: chosen.config.model,
      modelKey: chosen.config.key,
      quality: chosen.config.quality,
      rationale: this.buildRationale(
        `Cost-aware routing selected ${chosen.config.key} for task "${task}".`,
        constraints,
        notes
      ),
      estimatedCost: chosen.estimatedCost,
      fallbacks: this.buildFallbacks(sortedCandidates, chosen)
    };
  }

  private async loadCatalog(): Promise<ModelRouterConfig> {
    if (this.catalogLoaded && this.catalog) {
      return this.catalog;
    }

    this.catalogLoaded = true;
    const bridge = new ContextBridge();
    const config = await bridge.getModelRouterConfig();
    const tierSnapshot = await bridge.getModelTierSnapshot();
    this.catalogStatus = await bridge.getModelCatalogStatus();

    const baseCatalog = config?.models?.length ? config : DEFAULT_MODEL_CATALOG;
    const models = baseCatalog.models.map(model => {
      const override = tierSnapshot?.tiers?.[model.key];
      return override ? { ...model, quality: override } : model;
    });

    this.catalog = {
      providerPreference: baseCatalog.providerPreference,
      models
    };

    return this.catalog;
  }

  private shouldPreferFrontier(task: string): boolean {
    return task === 'planning' || task === 'council' || task === 'model-rating';
  }

  private isProviderAvailable(provider: Provider): boolean {
    if (provider === 'anthropic') {
      return Boolean(process.env.ANTHROPIC_API_KEY);
    }
    if (provider === 'openai') {
      return Boolean(process.env.OPENAI_API_KEY);
    }
    if (provider === 'openrouter') {
      return Boolean(process.env.OPENROUTER_API_KEY);
    }
    if (provider === 'gemini') {
      return Boolean(process.env.GEMINI_API_KEY);
    }
    return false;
  }

  private qualityRank(quality: QualityTier): number {
    if (quality === 'fast') return 1;
    if (quality === 'balanced') return 2;
    return 3;
  }

  private resolvePricingForModel(config: RoutedModelConfig): Pricing | null {
    try {
      return pricingFromUsdPerMillion({
        inputUsdPerMillion: config.costPerMTokIn,
        outputUsdPerMillion: config.costPerMTokOut
      });
    } catch {
      return null;
    }
  }

  private normalizeUsage(inputTokens: number, outputTokens: number): TokenUsageNormalized {
    return (
      normalizeTokenUsage({ inputTokens, outputTokens }) || {
        inputTokens: Math.max(0, Math.floor(inputTokens)),
        outputTokens: Math.max(0, Math.floor(outputTokens)),
        totalTokens: Math.max(0, Math.floor(inputTokens + outputTokens))
      }
    );
  }

  private estimateCostForTokens(
    config: RoutedModelConfig,
    inputTokens: number,
    outputTokens: number
  ): number {
    const usage = this.normalizeUsage(inputTokens, outputTokens);
    const pricing = this.resolvePricingForModel(config);
    const breakdown = estimateUsdCost({ usage, pricing });
    return breakdown?.totalUsd ?? 0;
  }

  async estimateCostForModelKey(
    modelKey: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<number> {
    const catalog = await this.loadCatalog();
    const model = catalog.models.find(entry => entry.key === modelKey);
    if (!model) {
      return 0;
    }

    const usage = this.normalizeUsage(inputTokens, outputTokens);
    const pricing = this.resolvePricingForModel(model);
    const breakdown = estimateUsdCost({ usage, pricing });
    return breakdown?.totalUsd ?? 0;
  }

  private buildCandidates(
    models: RoutedModelConfig[],
    inputTokens: number,
    outputTokens: number
  ): RoutingCandidate[] {
    return models.map(model => ({
      config: model,
      estimatedCost: this.estimateCostForTokens(model, inputTokens, outputTokens)
    }));
  }

  private sortCandidates(
    candidates: RoutingCandidate[],
    providerPreference: Provider[]
  ): RoutingCandidate[] {
    const preferenceIndex = new Map(
      providerPreference.map((provider, index) => [provider, index])
    );

    return [...candidates].sort((a, b) => {
      const costDelta = a.estimatedCost - b.estimatedCost;
      if (Math.abs(costDelta) > 1e-9) {
        return costDelta;
      }

      const aRank = preferenceIndex.get(a.config.provider) ?? providerPreference.length;
      const bRank = preferenceIndex.get(b.config.provider) ?? providerPreference.length;
      return aRank - bRank;
    });
  }

  private buildFallbacks(
    candidates: RoutingCandidate[],
    chosen: RoutingCandidate
  ): { provider: Provider; model: string; modelKey: string; quality: QualityTier; estimatedCost: number }[] {
    return candidates
      .filter(candidate => candidate !== chosen)
      .map(candidate => ({
        provider: candidate.config.provider,
        model: candidate.config.model,
        modelKey: candidate.config.key,
        quality: candidate.config.quality,
        estimatedCost: candidate.estimatedCost
      }));
  }

  private buildRationale(base: string, constraints: string[], notes: string[]): string {
    const constraintText = constraints.length > 0
      ? ` Constraints: ${constraints.join(', ')}.`
      : '';
    const notesText = notes.length > 0 ? ` Notes: ${notes.join(' ')}` : '';
    return `${base}${constraintText}${notesText}`;
  }

  /**
   * Get the client for a specific provider
   */
  getClient(provider: Provider): Anthropic | OpenAI | null {
    switch (provider) {
      case 'anthropic':
        return this.anthropic;
      case 'openai':
        return this.openai;
      case 'openrouter':
        // OpenRouter uses OpenAI client with custom base URL
        return new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1'
        });
      default:
        return null;
    }
  }

  async invokeText(
    selection: { provider: Provider; model: string },
    prompt: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<InvokeResult> {
    if (!this.isProviderAvailable(selection.provider)) {
      throw new Error(`Provider "${selection.provider}" is not configured.`);
    }

    const maxTokens = options?.maxTokens ?? 250;
    const temperature = options?.temperature ?? 0;
    const started = Date.now();

    if (selection.provider === 'anthropic') {
      const message = await this.anthropic.messages.create({
        model: selection.model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      const contentBlocks = (message as any)?.content ?? [];
      const text = Array.isArray(contentBlocks)
        ? contentBlocks.map((block: any) => block?.text ?? '').join('')
        : '';
      const usage = (message as any)?.usage || {};

      return {
        text,
        inputTokens: Number(usage.input_tokens || 0),
        outputTokens: Number(usage.output_tokens || 0),
        latencyMs: Date.now() - started
      };
    }

    if (selection.provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set.');
      }

      const modelPath = selection.model.startsWith('models/')
        ? selection.model
        : `models/${selection.model}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

      const response = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature
        }
      });

      const data = response.data ?? {};
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      const text = candidates
        .map((candidate: any) =>
          (candidate?.content?.parts ?? [])
            .map((part: any) => part?.text ?? '')
            .join('')
        )
        .join('');
      const usage = data.usageMetadata ?? {};

      return {
        text,
        inputTokens: Number(usage.promptTokenCount || 0),
        outputTokens: Number(usage.candidatesTokenCount || usage.totalTokenCount || 0),
        latencyMs: Date.now() - started
      };
    }

    const client = this.getClient(selection.provider) as OpenAI | null;
    if (!client) {
      throw new Error(`No client available for provider "${selection.provider}".`);
    }

    const completion = await client.chat.completions.create({
      model: selection.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    });

    return {
      text: completion?.choices?.[0]?.message?.content ?? '',
      inputTokens: completion?.usage?.prompt_tokens ?? 0,
      outputTokens: completion?.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - started
    };
  }

  /**
   * Update budget remaining and record cost entry
   */
  updateBudget(
    costIncurred: number,
    details?: {
      model: string;
      modelKey?: string;
      provider?: Provider;
      inputTokens: number;
      outputTokens: number;
      latencyMs?: number;
      operation: string;
    }
  ): void {
    this.budgetRemaining -= costIncurred;

    // Record cost entry
    const entry: CostEntry = {
      id: details?.modelKey
        ? `${details.modelKey}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
        : undefined,
      timestamp: new Date().toISOString(),
      model: details?.model || 'unknown',
      modelKey: details?.modelKey,
      provider: details?.provider,
      inputTokens: details?.inputTokens || 0,
      outputTokens: details?.outputTokens || 0,
      latencyMs: details?.latencyMs,
      cost: costIncurred,
      operation: details?.operation || 'api-call'
    };
    this.costEntries.push(entry);

    if (this.budgetRemaining < 0) {
      console.warn('??  Monthly budget exceeded!');
    }
  }

  /**
   * Get all cost entries for the current session
   */
  getCostEntries(): CostEntry[] {
    return [...this.costEntries];
  }

  /**
   * Get session costs summary
   */
  getSessionCosts(): SessionCosts {
    const entries = this.getCostEntries();
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);

    const byModel: Record<string, number> = {};
    const byOperation: Record<string, number> = {};

    for (const entry of entries) {
      byModel[entry.model] = (byModel[entry.model] || 0) + entry.cost;
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + entry.cost;
    }

    return {
      sessionId: this.sessionId || 'unknown',
      entries,
      totalCost,
      byModel,
      byOperation
    };
  }

  /**
   * Persist cost entries to the context bridge
   */
  async persistCosts(): Promise<void> {
    if (!this.sessionId || this.costEntries.length === 0) {
      return;
    }

    const contextPath = process.env.JANUS_CONTEXT_PATH || './janus-context';
    const costsDir = path.join(contextPath, 'costs');
    const costsFile = path.join(costsDir, `${this.sessionId}.json`);

    try {
      await fs.mkdir(costsDir, { recursive: true });
      const sessionCosts = this.getSessionCosts();
      await fs.writeFile(costsFile, JSON.stringify(sessionCosts, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to persist costs:', error);
    }
  }

  /**
   * Clear cost entries (typically after persisting)
   */
  clearCostEntries(): void {
    this.costEntries = [];
  }

  /**
   * Get current budget status
   */
  getBudgetStatus(): {
    monthlyBudget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  } {
    const monthlyBudget = getMonthlyBudget();
    const spent = monthlyBudget - this.budgetRemaining;
    return {
      monthlyBudget,
      spent: Math.max(0, spent),
      remaining: Math.max(0, this.budgetRemaining),
      percentageUsed: Math.min(100, (spent / monthlyBudget) * 100)
    };
  }
}

export default ModelRouter;
