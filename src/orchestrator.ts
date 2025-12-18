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
  private currentSession: Session | null = null;

  constructor() {
    this.contextBridge = new ContextBridge();
    this.modelRouter = new ModelRouter();
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

      // Step 4: Sync context
      console.log(`\n💾 Step 4: Syncing context...`);
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

  /**
   * Execute the plan steps
   */
  private async executePlan(plan: ExecutionPlan): Promise<void> {
    for (const step of plan.steps) {
      console.log(`\n   [${step.type.toUpperCase()}] ${step.description}`);
      step.status = 'running';

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

        // In Week 2, this will actually call the swarms
        // For now, simulate completion
        step.status = 'complete';
        step.result = `[Mock] Completed ${step.type} step`;

        // Update budget
        this.modelRouter.updateBudget(routing.estimatedCost);

        console.log(`      ✅ Complete`);
      } catch (error) {
        step.status = 'failed';
        step.error = String(error);
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
