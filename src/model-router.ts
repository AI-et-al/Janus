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
import * as fs from 'fs/promises';
import { existsSync, readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { CostEntry, SessionCosts } from './types.js';

export type Provider = 'anthropic' | 'openai' | 'openrouter';
export type Model = 'haiku' | 'sonnet' | 'opus' | 'gpt-4' | 'gpt-4-turbo';

interface ModelConfig {
  provider: Provider;
  model: string;
  costPerMTok: number; // Cost per million tokens (input)
  costPerMTokOutput: number;
}

interface RoutingDecision {
  provider: Provider;
  model: string;
  rationale: string;
  estimatedCost: number;
}

const MODEL_CONFIGS: Record<Model, ModelConfig> = {
  haiku: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    costPerMTok: 0.8,
    costPerMTokOutput: 4.0
  },
  sonnet: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    costPerMTok: 3.0,
    costPerMTokOutput: 15.0
  },
  opus: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    costPerMTok: 15.0,
    costPerMTokOutput: 75.0
  },
  'gpt-4': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    costPerMTok: 10.0,
    costPerMTokOutput: 30.0
  },
  'gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    costPerMTok: 10.0,
    costPerMTokOutput: 30.0
  }
};

export class ModelRouter {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private budgetRemaining: number;
  private enableCostOptimization: boolean;
  private costEntries: CostEntry[] = [];
  private sessionId: string | null = null;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const monthlyBudget = parseFloat(process.env.JANUS_BUDGET_MONTHLY || '150');
    const spentThisMonth = this.computeSpentThisMonthFromContext();
    this.budgetRemaining = monthlyBudget - spentThisMonth;
    this.enableCostOptimization = process.env.ENABLE_COST_OPTIMIZATION === 'true';
  }

  /**
   * Set the current session ID for cost tracking
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Route a request to the optimal model provider
   */
  async routeRequest(
    prompt: string,
    task: string,
    options?: {
      model?: Model;
      minQuality?: 'fast' | 'balanced' | 'quality';
      maxCost?: number;
    }
  ): Promise<RoutingDecision> {
    const model = options?.model || 'sonnet';
    const minQuality = options?.minQuality || 'balanced';

    // If cost optimization disabled, use specified model
    if (!this.enableCostOptimization) {
      const config = MODEL_CONFIGS[model];
      return {
        provider: config.provider,
        model: config.model,
        rationale: 'Cost optimization disabled; using configured model',
        estimatedCost: this.estimateCost(prompt, config)
      };
    }

    // Cost optimization enabled: smart routing
    const estimatedInputTokens = Math.ceil(prompt.length / 4); // Rough estimate
    const estimatedOutputTokens = estimatedInputTokens * 0.5; // Conservative estimate

    return this.selectOptimalProvider(
      model,
      minQuality,
      estimatedInputTokens,
      estimatedOutputTokens,
      task
    );
  }

  private selectOptimalProvider(
    preferredModel: Model,
    _minQuality: string,
    inputTokens: number,
    outputTokens: number,
    task: string
  ): RoutingDecision {
    const config = MODEL_CONFIGS[preferredModel];
    const estimatedCost = this.estimateCost('', config, inputTokens, outputTokens);

    // Check if we have budget remaining
    if (estimatedCost > this.budgetRemaining) {
      // Switch to cheaper alternative if available
      let cheaperModel = preferredModel;
      if (preferredModel === 'opus') {
        cheaperModel = 'sonnet';
      } else if (preferredModel === 'sonnet') {
        cheaperModel = 'haiku';
      }

      const cheaperConfig = MODEL_CONFIGS[cheaperModel];
      const cheaperCost = this.estimateCost('', cheaperConfig, inputTokens, outputTokens);

      return {
        provider: cheaperConfig.provider,
        model: cheaperConfig.model,
        rationale: `Budget constraint: ${preferredModel} (${estimatedCost.toFixed(4)}$) > remaining (${this.budgetRemaining.toFixed(2)}$). Using ${cheaperModel} instead.`,
        estimatedCost: cheaperCost
      };
    }

    return {
      provider: config.provider,
      model: config.model,
      rationale: `Quality-first routing: ${preferredModel} selected for task "${task}" within budget.`,
      estimatedCost
    };
  }

  private estimateCost(
    text: string,
    config: ModelConfig,
    inputTokens?: number,
    outputTokens?: number
  ): number {
    const inTokens = inputTokens || Math.ceil(text.length / 4);
    const outTokens = outputTokens || inTokens * 0.5;

    const inputCost = (inTokens / 1_000_000) * config.costPerMTok;
    const outputCost = (outTokens / 1_000_000) * config.costPerMTokOutput;

    return inputCost + outputCost;
  }

  private computeSpentThisMonthFromContext(): number {
    const contextPath = process.env.JANUS_CONTEXT_PATH || './janus-context';
    const costsDir = path.join(contextPath, 'costs');
    if (!existsSync(costsDir)) {
      return 0;
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    let total = 0;

    try {
      const files = readdirSync(costsDir).filter(file => file.endsWith('.json'));
      for (const file of files) {
        try {
          const contents = readFileSync(path.join(costsDir, file), 'utf-8');
          const sessionCosts = JSON.parse(contents) as SessionCosts;
          if (!sessionCosts?.entries) {
            continue;
          }

          for (const entry of sessionCosts.entries) {
            if (entry?.timestamp?.slice(0, 7) === monthKey) {
              total += Number(entry.cost || 0);
            }
          }
        } catch (error) {
          console.warn(`Failed to read cost file ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to read cost directory:', error);
    }

    return total;
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

  /**
   * Update budget remaining and record cost entry
   */
  updateBudget(
    costIncurred: number,
    details?: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      operation: string;
    }
  ): void {
    this.budgetRemaining -= costIncurred;

    // Record cost entry
    const entry: CostEntry = {
      timestamp: new Date().toISOString(),
      model: details?.model || 'unknown',
      inputTokens: details?.inputTokens || 0,
      outputTokens: details?.outputTokens || 0,
      cost: costIncurred,
      operation: details?.operation || 'api-call'
    };
    this.costEntries.push(entry);

    if (this.budgetRemaining < 0) {
      console.warn('⚠️  Monthly budget exceeded!');
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
    const monthlyBudget = parseFloat(process.env.JANUS_BUDGET_MONTHLY || '150');
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
