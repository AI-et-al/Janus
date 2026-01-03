import { v4 as uuidv4 } from 'uuid';

import type {
  AdvisorId,
  Deliberation,
  Proposal,
  Provider,
  RoutedModelConfig
} from '../../types.js';
import ModelRouter from '../../model-router.js';
import { buildAdvisorPrompt, buildSynthesisPrompt, loadManifesto } from './prompts.js';
import { parseProposal, parseSynthesis } from './parse.js';

export class BudgetBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetBlockedError';
  }
}

export interface CouncilRunResult {
  deliberation: Deliberation;
  synthesisMeta: {
    modelKey: string;
    provider: Provider;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    costUsd: number;
  };
}

interface AdvisorConfig {
  id: AdvisorId;
  modelKey: string;
}

interface AdvisorPlan {
  advisorId: AdvisorId;
  modelKey: string;
  model: RoutedModelConfig;
  prompt: string;
  inputTokens: number;
  estimatedCost: number;
}

export interface CouncilOptions {
  advisors?: AdvisorConfig[];
  synthesisModelKey?: string;
  maxTokens?: {
    advisor?: number;
    synthesis?: number;
  };
  temperature?: number;
}

const DEFAULT_ADVISORS: AdvisorConfig[] = [
  { id: 'claude', modelKey: 'sonnet' },
  { id: 'gpt', modelKey: 'gpt-4-turbo' },
  { id: 'gemini', modelKey: 'gemini-pro' }
];
const DEFAULT_SYNTHESIS_MODEL = 'sonnet';
const DEFAULT_ADVISOR_MAX_TOKENS = 700;
const DEFAULT_SYNTHESIS_MAX_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0;

export class CouncilSwarm {
  private modelRouter: ModelRouter;
  private advisors: AdvisorConfig[];
  private synthesisModelKey: string;
  private maxAdvisorTokens: number;
  private maxSynthesisTokens: number;
  private temperature: number;

  constructor(modelRouter: ModelRouter, options: CouncilOptions = {}) {
    this.modelRouter = modelRouter;
    this.advisors = options.advisors ?? DEFAULT_ADVISORS;
    this.synthesisModelKey = options.synthesisModelKey ?? DEFAULT_SYNTHESIS_MODEL;
    this.maxAdvisorTokens = options.maxTokens?.advisor ?? DEFAULT_ADVISOR_MAX_TOKENS;
    this.maxSynthesisTokens = options.maxTokens?.synthesis ?? DEFAULT_SYNTHESIS_MAX_TOKENS;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  }

  async run(task: string, context?: string): Promise<CouncilRunResult> {
    const manifesto = await loadManifesto();
    const contextText = context?.trim() ?? '';

    const catalog = await this.modelRouter.getCatalog();
    const modelsByKey = new Map(
      catalog.models.map(model => [model.key, model])
    );

    const synthesisModel = modelsByKey.get(this.synthesisModelKey);
    if (!synthesisModel) {
      throw new Error(`Council synthesis model "${this.synthesisModelKey}" not found.`);
    }
    if (!this.isProviderConfigured(synthesisModel.provider)) {
      throw new Error(`Provider "${synthesisModel.provider}" is not configured.`);
    }

    const advisorCandidates = this.advisors.map(advisor => {
      const model = modelsByKey.get(advisor.modelKey);
      if (!model) {
        throw new Error(`Council advisor model "${advisor.modelKey}" not found.`);
      }
      return { ...advisor, model };
    });

    const availableAdvisors = advisorCandidates.filter(advisor =>
      this.isProviderConfigured(advisor.model.provider)
    );

    if (availableAdvisors.length === 0) {
      throw new Error('No council advisors available. Configure provider API keys.');
    }

    if (availableAdvisors.length < advisorCandidates.length) {
      const missing = advisorCandidates
        .filter(advisor => !this.isProviderConfigured(advisor.model.provider))
        .map(advisor => `${advisor.id}:${advisor.model.provider}`);
      console.log(`      Council: skipping advisors without API keys (${missing.join(', ')})`);
    }

    const advisorPlans: AdvisorPlan[] = [];
    for (const advisor of availableAdvisors) {
      const prompt = buildAdvisorPrompt({
        advisorId: advisor.id,
        task,
        context: contextText,
        manifesto
      });
      const inputTokens = this.estimateTokens(prompt);
      const estimatedCost = await this.modelRouter.estimateCostForModelKey(
        advisor.modelKey,
        inputTokens,
        this.maxAdvisorTokens
      );
      advisorPlans.push({
        advisorId: advisor.id,
        modelKey: advisor.modelKey,
        model: advisor.model,
        prompt,
        inputTokens,
        estimatedCost
      });
    }

    const baseSynthesisPrompt = buildSynthesisPrompt({
      task,
      proposals: [],
      manifesto
    });
    const baseSynthesisTokens = this.estimateTokens(baseSynthesisPrompt);

    const estimateTotalCost = async (plans: AdvisorPlan[]) => {
      const advisorCost = plans.reduce((sum, plan) => sum + plan.estimatedCost, 0);
      const synthesisInputTokens = baseSynthesisTokens + plans.length * this.maxAdvisorTokens;
      const synthesisCost = await this.modelRouter.estimateCostForModelKey(
        this.synthesisModelKey,
        synthesisInputTokens,
        this.maxSynthesisTokens
      );
      return {
        totalCost: advisorCost + synthesisCost,
        synthesisInputTokens
      };
    };

    const budget = this.modelRouter.getBudgetStatus();
    let selectedPlans = [...advisorPlans];
    let estimate = await estimateTotalCost(selectedPlans);

    if (estimate.totalCost > budget.remaining) {
      selectedPlans.sort((a, b) => b.estimatedCost - a.estimatedCost);
      const dropped: AdvisorPlan[] = [];

      while (selectedPlans.length > 1 && estimate.totalCost > budget.remaining) {
        const removed = selectedPlans.shift();
        if (removed) {
          dropped.push(removed);
        }
        estimate = await estimateTotalCost(selectedPlans);
      }

      if (dropped.length > 0) {
        const droppedLabels = dropped.map(item => item.advisorId).join(', ');
        console.log(`      Council: dropped advisors to fit budget (${droppedLabels})`);
      }
    }

    if (estimate.totalCost > budget.remaining) {
      throw new BudgetBlockedError(
        `Blocked: estimated council cost $${estimate.totalCost.toFixed(6)} exceeds ` +
        `remaining $${budget.remaining.toFixed(6)}`
      );
    }

    const advisorResults = await Promise.allSettled(
      selectedPlans.map(async plan => {
        const response = await this.modelRouter.invokeText(
          { provider: plan.model.provider, model: plan.model.model },
          plan.prompt,
          { maxTokens: this.maxAdvisorTokens, temperature: this.temperature }
        );

        const parsed = parseProposal(response.text, plan.advisorId);
        const costUsd = await this.modelRouter.estimateCostForModelKey(
          plan.modelKey,
          response.inputTokens,
          response.outputTokens
        );

        if (costUsd > 0) {
          this.modelRouter.updateBudget(costUsd, {
            model: plan.model.model,
            modelKey: plan.modelKey,
            provider: plan.model.provider,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            latencyMs: response.latencyMs,
            operation: 'council-advisor'
          });
        }

        const proposal: Proposal = {
          advisor: plan.advisorId,
          response: parsed.response,
          confidence: parsed.confidence,
          uncertainties: parsed.uncertainties,
          assumptions: parsed.assumptions,
          alternatives: parsed.alternatives,
          delegations: parsed.delegations,
          reasoning: parsed.reasoning,
          tokenCount: response.inputTokens + response.outputTokens,
          cost: costUsd,
          latencyMs: response.latencyMs
        };

        return {
          proposal,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          latencyMs: response.latencyMs,
          costUsd
        };
      })
    );

    const proposals: Proposal[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (let index = 0; index < advisorResults.length; index++) {
      const result = advisorResults[index];
      const plan = selectedPlans[index];
      const advisorId = plan?.advisorId ?? 'claude';

      if (result?.status === 'fulfilled') {
        proposals.push(result.value.proposal);
        totalTokens += result.value.inputTokens + result.value.outputTokens;
        totalCost += result.value.costUsd;
        continue;
      }

      const message = result?.reason instanceof Error
        ? result.reason.message
        : String(result?.reason ?? 'unknown error');
      proposals.push({
        advisor: advisorId,
        response: `Advisor failed: ${message}`,
        confidence: 10,
        uncertainties: ['advisor_call_failed'],
        assumptions: [],
        alternatives: [],
        delegations: [],
        reasoning: 'Advisor call failed before producing a proposal.',
        tokenCount: 0,
        cost: 0,
        latencyMs: 0
      });
    }

    const synthesisPrompt = buildSynthesisPrompt({
      task,
      proposals,
      manifesto
    });

    const synthesisResponse = await this.modelRouter.invokeText(
      { provider: synthesisModel.provider, model: synthesisModel.model },
      synthesisPrompt,
      { maxTokens: this.maxSynthesisTokens, temperature: this.temperature }
    );

    const synthesisCost = await this.modelRouter.estimateCostForModelKey(
      this.synthesisModelKey,
      synthesisResponse.inputTokens,
      synthesisResponse.outputTokens
    );

    if (synthesisCost > 0) {
      this.modelRouter.updateBudget(synthesisCost, {
        model: synthesisModel.model,
        modelKey: this.synthesisModelKey,
        provider: synthesisModel.provider,
        inputTokens: synthesisResponse.inputTokens,
        outputTokens: synthesisResponse.outputTokens,
        latencyMs: synthesisResponse.latencyMs,
        operation: 'council-synthesis'
      });
    }

    totalTokens += synthesisResponse.inputTokens + synthesisResponse.outputTokens;
    totalCost += synthesisCost;

    const synthesisParsed = parseSynthesis(synthesisResponse.text);

    const deliberation: Deliberation = {
      id: uuidv4(),
      task,
      proposals,
      disagreements: synthesisParsed.disagreements,
      consensus: synthesisParsed.consensus,
      synthesizedAnswer: synthesisParsed.synthesizedAnswer,
      totalTokens,
      totalCost,
      timestamp: new Date().toISOString()
    };

    return {
      deliberation,
      synthesisMeta: {
        modelKey: this.synthesisModelKey,
        provider: synthesisModel.provider,
        model: synthesisModel.model,
        inputTokens: synthesisResponse.inputTokens,
        outputTokens: synthesisResponse.outputTokens,
        latencyMs: synthesisResponse.latencyMs,
        costUsd: synthesisCost
      }
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private isProviderConfigured(provider: Provider): boolean {
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
}
