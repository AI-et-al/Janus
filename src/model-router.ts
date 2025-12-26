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
import { OllamaCloud, createOllamaClient } from './ollama-cloud.js';

export type Provider = 'anthropic' | 'openai' | 'openrouter' | 'ollama';
export type Model = 'haiku' | 'sonnet' | 'opus' | 'gpt-4' | 'gpt-4-turbo' | 'glm-4' | 'ollama-custom';

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
  },
  'glm-4': {
    provider: 'ollama',
    model: 'glm4:latest',  // GLM 4.7 via Ollama
    costPerMTok: 0.0,      // Self-hosted = no API cost
    costPerMTokOutput: 0.0
  },
  'ollama-custom': {
    provider: 'ollama',
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    costPerMTok: 0.0,
    costPerMTokOutput: 0.0
  }
};

export class ModelRouter {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private ollama: OllamaCloud | null;
  private budgetRemaining: number;
  private enableCostOptimization: boolean;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize Ollama client if configured
    this.ollama = createOllamaClient();

    this.budgetRemaining = parseFloat(process.env.JANUS_BUDGET_MONTHLY || '150');
    this.enableCostOptimization = process.env.ENABLE_COST_OPTIMIZATION === 'true';
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

  /**
   * Get the client for a specific provider
   */
  getClient(provider: Provider): Anthropic | OpenAI | OllamaCloud | null {
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
      case 'ollama':
        return this.ollama;
      default:
        return null;
    }
  }

  /**
   * Get the Ollama client directly
   */
  getOllamaClient(): OllamaCloud | null {
    return this.ollama;
  }

  /**
   * Update budget remaining (typically called after each operation)
   */
  updateBudget(costIncurred: number): void {
    this.budgetRemaining -= costIncurred;
    if (this.budgetRemaining < 0) {
      console.warn('⚠️  Monthly budget exceeded!');
    }
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
