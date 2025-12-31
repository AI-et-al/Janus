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

import { ContextBridge, Session, Task, Decision } from './context-bridge/index.js';
import ModelRouter from './model-router.js';
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
  model: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
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
      model: 'haiku',
      status: 'pending'
    };

    const councilStep: ExecutionStep = {
      id: uuidv4(),
      type: 'council',
      description: `Deliberate on research findings`,
      model: 'sonnet',
      status: 'pending'
    };

    const executorStep: ExecutionStep = {
      id: uuidv4(),
      type: 'executor',
      description: `Execute recommended approach`,
      model: 'sonnet',
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
        model: step.model
      };

      await this.contextBridge.delegateTask(delegatedTask);
    }
  }

  /**
   * Execute the plan steps
   */
  private async executePlan(plan: ExecutionPlan): Promise<void> {
    await this.persistPlanTasks(plan);
    for (const step of plan.steps) {
      console.log(`\n   [${step.type.toUpperCase()}] ${step.description}`);
      step.status = 'running';
      const stepStart = Date.now();

      try {
        // Get routing decision for this step
        const routing = await this.modelRouter.routeRequest(
          step.description,
          step.type,
          { model: step.model as any }
        );

        console.log(`      Provider: ${routing.provider} (${routing.model})`);
        console.log(`      Cost: $${routing.estimatedCost.toFixed(6)}`);
        console.log(`      Reason: ${routing.rationale}`);

        await this.contextBridge.updateTask(step.id, {
          status: 'running',
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
        await this.contextBridge.updateTask(step.id, {
          status: 'complete',
          result: step.result,
          duration: Date.now() - stepStart
        });

        // Update budget
        const inputTokens = Math.ceil(step.description.length / 4);
        const outputTokens = Math.ceil(inputTokens * 0.5);
        this.modelRouter.updateBudget(routing.estimatedCost, {
          model: routing.model,
          inputTokens,
          outputTokens,
          operation: step.type
        });

        console.log(`      ✅ Complete`);
      } catch (error) {
        step.status = 'failed';
        step.error = String(error);
        await this.contextBridge.updateTask(step.id, {
          status: 'failed',
          error: String(error),
          duration: Date.now() - stepStart
        });
        console.log(`      ❌ Failed: ${error}`);
      }
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
