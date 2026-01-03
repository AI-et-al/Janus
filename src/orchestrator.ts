/**
 * Janus Orchestrator
 *
 * Main execution engine that coordinates:
 * - Context Bridge (persistent state)
 * - Model Router (intelligent provider selection)
 * - Scout Swarm (research)
 * - Council Swarm (deliberation)
 * - Executor Swarm (implementation)
 */

import type { QualityTier, ModelRatingEvent } from './types.js';

import { ContextBridge, Session, Task, Decision } from './context-bridge/index.js';
import ModelRouter, { type RoutingDecision } from './model-router.js';
import {
  buildPeerRatingPrompt,
  parsePeerRatingResponse,
  recomputeModelTierSnapshot
} from './model-feedback.js';
import { ScoutSwarm, ScoutTask } from './swarms/scout/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionPlan {
  id: string;
  sessionId: string;
  steps: ExecutionStep[];
  estimatedTokens: number;
  estimatedCost: number;
}

export interface ExecutionStep {
  id: string;
  type: 'scout' | 'council' | 'executor';
  description: string;
  minQuality: QualityTier;
  model?: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'blocked';
  result?: string;
  error?: string;
}

export class JanusOrchestrator {
  private contextBridge: ContextBridge;
  private modelRouter: ModelRouter;
  private scoutSwarm: ScoutSwarm;
  private currentSession: Session | null = null;

  constructor() {
    this.contextBridge = new ContextBridge();
    this.modelRouter = new ModelRouter();
    this.scoutSwarm = new ScoutSwarm();
  }

  /**
   * Execute a high-level task
   */
  async executeTask(description: string): Promise<string> {
    console.log(`\n🎯 Janus Orchestrator: Starting task execution`);
    console.log(`   Task: ${description}`);

    try {
      // Step 1: Create session
      console.log(`\n📋 Step 1: Creating session...`);
      this.currentSession = await this.contextBridge.createSession(description);
      this.modelRouter.setSessionId(this.currentSession.id);
      console.log(`   ✅ Session ${this.currentSession.id.substring(0, 8)}... created`);

      // Step 2: Create execution plan
      console.log(`\n🗺️  Step 2: Creating execution plan...`);
      const plan = await this.createExecutionPlan(description);
      console.log(`   ✅ Plan created with ${plan.steps.length} steps`);
      console.log(`   Estimated cost: $${plan.estimatedCost.toFixed(4)}`);

      // Step 3: Execute plan
      console.log(`\n⚙️  Step 3: Executing plan...`);
      await this.executePlan(plan);
      console.log(`   ✅ Plan executed`);

      // Step 4: Persist costs
      console.log(`\n💾 Step 4: Persisting costs...`);
      await this.modelRouter.persistCosts();
      this.modelRouter.clearCostEntries();
      console.log(`   ✅ Costs persisted`);

      // Step 5: Sync context
      console.log(`\n💾 Step 5: Syncing context...`);
      await this.contextBridge.sync(`Completed task execution: ${description}`);
      console.log(`   ✅ Context synced to git`);

      return this.currentSession.id;
    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Create a high-level execution plan
   */
  private async createExecutionPlan(task: string): Promise<ExecutionPlan> {
    const plan: ExecutionPlan = {
      id: uuidv4(),
      sessionId: this.currentSession?.id || '',
      steps: [],
      estimatedTokens: 0,
      estimatedCost: 0
    };

    // For now, create a simple 3-step plan: scout -> council -> executor
    // In Week 2, this will be more sophisticated

    const scoutStep: ExecutionStep = {
      id: uuidv4(),
      type: 'scout',
      description: `Research: ${task}`,
      minQuality: 'fast',
      status: 'pending'
    };

    const councilStep: ExecutionStep = {
      id: uuidv4(),
      type: 'council',
      description: `Deliberate on research findings`,
      minQuality: 'balanced',
      status: 'pending'
    };

    const executorStep: ExecutionStep = {
      id: uuidv4(),
      type: 'executor',
      description: `Execute recommended approach`,
      minQuality: 'balanced',
      status: 'pending'
    };

    plan.steps = [scoutStep, councilStep, executorStep];

    // Estimate costs
    const routing = await this.modelRouter.routeRequest(task, 'planning');
    plan.estimatedCost = routing.estimatedCost * 3; // Rough multiplier for 3 steps
    plan.estimatedTokens = 3000; // Placeholder

    return plan;
  }

  private async persistPlanTasks(plan: ExecutionPlan): Promise<void> {
    for (const [index, step] of plan.steps.entries()) {
      const dependencies = index > 0 ? [plan.steps[index - 1]?.id || ''] : [];
      const assignedTo: Task['assignedTo'] =
        step.type === 'scout' ? 'scout-swarm' : step.type === 'council' ? 'council' : 'executor-swarm';

      const delegatedTask: Task = {
        id: step.id,
        description: step.description,
        assignedTo,
        status: 'pending',
        context: `session=${plan.sessionId};plan=${plan.id};step=${step.type}`,
        dependencies: dependencies.filter(Boolean),
        artifacts: [],
        modelKey: step.model
      };

      await this.contextBridge.delegateTask(delegatedTask);
    }
  }

  /**
   * Execute the plan steps
   */
  private async executePlan(plan: ExecutionPlan): Promise<void> {
    await this.persistPlanTasks(plan);
    for (let index = 0; index < plan.steps.length; index++) {
      const step = plan.steps[index];
      console.log(`\n   [${step.type.toUpperCase()}] ${step.description}`);
      const stepStart = Date.now();
      let routing: RoutingDecision | null = null;

      try {
        // Get routing decision for this step
        routing = await this.modelRouter.routeRequest(
          step.description,
          step.type,
          { model: step.model, minQuality: step.minQuality }
        );

        console.log(`      Provider: ${routing.provider} (${routing.model})`);
        console.log(`      Model Key: ${routing.modelKey} (${routing.quality})`);
        console.log(`      Cost: $${routing.estimatedCost.toFixed(6)}`);
        console.log(`      Reason: ${routing.rationale}`);

        const budget = this.modelRouter.getBudgetStatus();
        if (routing.estimatedCost > budget.remaining) {
          const errorMessage = `Blocked: estimated cost $${routing.estimatedCost.toFixed(
            6
          )} exceeds remaining $${budget.remaining.toFixed(6)}`;
          step.status = 'blocked';
          step.error = errorMessage;
          await this.contextBridge.updateTask(step.id, {
            status: 'blocked',
            error: errorMessage,
            duration: Date.now() - stepStart
          });

          for (const blockedStep of plan.steps.slice(index + 1)) {
            blockedStep.status = 'blocked';
            blockedStep.error = 'Blocked: monthly budget exhausted';
            await this.contextBridge.updateTask(blockedStep.id, {
              status: 'blocked',
              error: blockedStep.error,
              duration: 0
            });
          }

          console.log(`      ? ${errorMessage}`);
          break;
        }

        await this.maybeAutoRatePreviousModel(routing, plan.sessionId);

        step.status = 'running';
        await this.contextBridge.updateTask(step.id, {
          status: 'running',
          modelKey: routing.modelKey,
          provider: routing.provider,
          model: routing.model,
          cost: routing.estimatedCost
        });

        if (step.type === 'scout') {
          console.log(`      ⚡ Engaging Scout Swarm...`);
          const task: ScoutTask = {
            id: uuidv4(),
            query: step.description,
            type: 'general-query'
          };
          const results = await this.scoutSwarm.execute([task]);
          step.result = JSON.stringify(results, null, 2);
          console.log(`      📝 Scout Results: ${results.length} items received`);
        } else {
          // In Week 2, this will actually call the swarms
          // For now, simulate completion
          step.result = `[Mock] Completed ${step.type} step`;
        }

        step.status = 'complete';
        const durationMs = Date.now() - stepStart;
        await this.contextBridge.updateTask(step.id, {
          status: 'complete',
          result: step.result,
          duration: durationMs
        });

        // Update budget
        const inputTokens = Math.ceil(step.description.length / 4);
        const outputTokens = Math.ceil(inputTokens * 0.5);
        this.modelRouter.updateBudget(routing.estimatedCost, {
          model: routing.model,
          modelKey: routing.modelKey,
          provider: routing.provider,
          inputTokens,
          outputTokens,
          latencyMs: durationMs,
          operation: step.type
        });

        await this.contextBridge.saveLastModelRun({
          timestamp: new Date().toISOString(),
          sessionId: plan.sessionId,
          taskId: step.id,
          operation: step.type,
          modelKey: routing.modelKey,
          provider: routing.provider,
          model: routing.model,
          costUsd: routing.estimatedCost,
          latencyMs: durationMs,
          resultExcerpt: (step.result ?? '').slice(0, 2000)
        });

        console.log(`      ✅ Complete`);
      } catch (error) {
        const durationMs = Date.now() - stepStart;
        step.status = 'failed';
        step.error = String(error);
        await this.contextBridge.updateTask(step.id, {
          status: 'failed',
          error: String(error),
          duration: durationMs
        });
        if (routing) {
          await this.contextBridge.saveLastModelRun({
            timestamp: new Date().toISOString(),
            sessionId: plan.sessionId,
            taskId: step.id,
            operation: step.type,
            modelKey: routing.modelKey,
            provider: routing.provider,
            model: routing.model,
            costUsd: routing.estimatedCost,
            latencyMs: durationMs,
            resultExcerpt: String(error).slice(0, 2000)
          });
        }
        console.log(`      ❌ Failed: ${error}`);
      }
    }
  }

  private async maybeAutoRatePreviousModel(
    rater: RoutingDecision,
    sessionId: string
  ): Promise<void> {
    if (process.env.ENABLE_MODEL_PEER_RATINGS === 'false') {
      return;
    }

    try {
      const lastRun = await this.contextBridge.getLastModelRun();
      if (!lastRun || !lastRun.modelKey || !lastRun.taskId) {
        return;
      }
      if (lastRun.sessionId !== sessionId) {
        return;
      }
      if (lastRun.operation === 'model-rating') {
        return;
      }
      if (lastRun.modelKey === rater.modelKey) {
        return;
      }

      const prompt = buildPeerRatingPrompt({
        previousModelKey: lastRun.modelKey,
        previousOperation: lastRun.operation,
        previousTaskId: lastRun.taskId,
        previousSessionId: lastRun.sessionId,
        previousCostUsd: lastRun.costUsd,
        previousLatencyMs: lastRun.latencyMs,
        previousResultExcerpt: lastRun.resultExcerpt
      });

      const ratingResp = await this.modelRouter.invokeText(
        { provider: rater.provider, model: rater.model },
        prompt,
        { maxTokens: 120, temperature: 0 }
      );

      const parsed = parsePeerRatingResponse(ratingResp.text);
      if (!parsed) {
        return;
      }

      const event: ModelRatingEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        sessionId,
        fromModelKey: rater.modelKey,
        toModelKey: lastRun.modelKey,
        toTaskId: lastRun.taskId,
        rating: parsed.rating,
        rationale: parsed.rationale,
        method: 'auto',
        toCostUsd: lastRun.costUsd,
        toLatencyMs: lastRun.latencyMs
      };

      await this.contextBridge.appendModelRating(event);

      const ratingCost = await this.modelRouter.estimateCostForModelKey(
        rater.modelKey,
        ratingResp.inputTokens,
        ratingResp.outputTokens
      );
      if (ratingCost > 0) {
        this.modelRouter.updateBudget(ratingCost, {
          model: rater.model,
          modelKey: rater.modelKey,
          provider: rater.provider,
          inputTokens: ratingResp.inputTokens,
          outputTokens: ratingResp.outputTokens,
          latencyMs: ratingResp.latencyMs,
          operation: 'model-rating'
        });
      }

      const catalog = (await this.contextBridge.getModelRouterConfig())
        ?? (await this.modelRouter.getCatalog());
      const allRatings = await this.contextBridge.listModelRatings();
      const previous = await this.contextBridge.getModelTierSnapshot();
      const snapshot = recomputeModelTierSnapshot(catalog, allRatings, { previous });
      await this.contextBridge.saveModelTierSnapshot(snapshot);
      this.modelRouter.refreshCatalog();
    } catch (error) {
      console.warn('Peer rating skipped:', error);
    }
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    const sessionIds = await this.contextBridge.listSessions();
    const sessions = await Promise.all(
      sessionIds.map((id: string) => this.contextBridge.loadSession(id))
    );
    return sessions;
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    return this.modelRouter.getBudgetStatus();
  }

  /**
   * Record a decision
   */
  async recordDecision(decision: Decision): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    await this.contextBridge.recordDecision(this.currentSession.id, decision);
  }

  /**
   * Delegate a task to a swarm
   */
  async delegateTask(task: Task): Promise<void> {
    await this.contextBridge.delegateTask(task);
  }
}

export default JanusOrchestrator;
