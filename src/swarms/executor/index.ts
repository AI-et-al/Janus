import type { ExecutorPlanV1, ExecutorResult } from '../../types.js';
import type { RoutingDecision } from '../../model-router.js';

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { BudgetBlockedError } from '../../errors.js';
import { ContextBridge } from '../../context-bridge/index.js';
import ModelRouter from '../../model-router.js';
import { buildExecutorPlanPrompt } from './prompts.js';
import { defaultExecutorSafety, resolveRepoPath, validatePlan } from './safety.js';
import { runCommand } from './runner.js';

function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Model did not return a JSON object.');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function safeArtifactName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export class ExecutorSwarm {
  private executorId: string;

  constructor(
    private modelRouter: ModelRouter,
    private contextBridge: ContextBridge
  ) {
    this.executorId = `executor-${uuidv4().slice(0, 8)}`;
  }

  async run(params: {
    sessionId: string;
    taskId: string;
    goal: string;
    priorContext: string;
    routing: RoutingDecision;
  }): Promise<ExecutorResult> {
    const started = Date.now();
    const safety = defaultExecutorSafety(process.cwd());
    const artifacts: string[] = [];
    const actionResults: Array<Record<string, unknown>> = [];
    let plan: ExecutorPlanV1 | null = null;
    let costUsd = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    const budget = this.modelRouter.getBudgetStatus();
    if (budget.remaining <= 0) {
      throw new BudgetBlockedError('Blocked: monthly budget exhausted');
    }
    if (params.routing.estimatedCost > budget.remaining) {
      throw new BudgetBlockedError(
        `Blocked: estimated executor cost $${params.routing.estimatedCost.toFixed(6)} exceeds ` +
        `remaining $${budget.remaining.toFixed(6)}`
      );
    }

    try {
      const planPrompt = buildExecutorPlanPrompt({
        goal: params.goal,
        priorContext: params.priorContext,
        maxActions: safety.maxActions,
        allowedCmds: [...safety.allowedCommands]
      });

      const planPromptArtifact = await this.contextBridge.writeArtifactText({
        sessionId: params.sessionId,
        taskId: params.taskId,
        name: 'executor-plan.prompt.txt',
        text: planPrompt
      });
      artifacts.push(planPromptArtifact);

      const planResp = await this.modelRouter.invokeText(
        { provider: params.routing.provider, model: params.routing.model },
        planPrompt,
        { maxTokens: 1800, temperature: 0 }
      );

      inputTokens = planResp.inputTokens;
      outputTokens = planResp.outputTokens;
      costUsd = await this.modelRouter.estimateCostForModelKey(
        params.routing.modelKey,
        inputTokens,
        outputTokens
      );

      if (costUsd > 0) {
        this.modelRouter.updateBudget(costUsd, {
          model: params.routing.model,
          modelKey: params.routing.modelKey,
          provider: params.routing.provider,
          inputTokens,
          outputTokens,
          latencyMs: planResp.latencyMs,
          operation: 'executor-plan'
        });
      }

      const rawPlanArtifact = await this.contextBridge.writeArtifactText({
        sessionId: params.sessionId,
        taskId: params.taskId,
        name: 'executor-plan.raw.txt',
        text: planResp.text
      });
      artifacts.push(rawPlanArtifact);

      const parsed = extractJsonObject(planResp.text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Executor plan is not a JSON object.');
      }

      plan = parsed as ExecutorPlanV1;
      if (!plan) {
        throw new Error('Executor plan missing.');
      }
      const planJsonArtifact = await this.contextBridge.writeArtifactJson({
        sessionId: params.sessionId,
        taskId: params.taskId,
        name: 'executor-plan.json',
        data: plan
      });
      artifacts.push(planJsonArtifact);

      validatePlan(plan, safety);

      for (let i = 0; i < plan.actions.length; i++) {
        const action = plan.actions[i];
        const indexLabel = String(i + 1).padStart(2, '0');

        if (action.type === 'write_file') {
          const absPath = resolveRepoPath(safety.repoRoot, action.path);
          await fs.mkdir(path.dirname(absPath), { recursive: true });
          await fs.writeFile(absPath, action.content, 'utf-8');

          const contentArtifact = await this.contextBridge.writeArtifactText({
            sessionId: params.sessionId,
            taskId: params.taskId,
            name: `actions/${indexLabel}-write_file-${safeArtifactName(action.path)}.txt`,
            text: action.content
          });
          artifacts.push(contentArtifact);

          actionResults.push({
            index: i,
            type: action.type,
            path: action.path,
            bytes: Buffer.byteLength(action.content, 'utf-8')
          });
          continue;
        }

        if (action.type === 'run_command') {
          const timeoutMs = action.timeoutMs ?? safety.maxCommandMs;
          const result = await runCommand({
            command: action.command,
            cwd: safety.repoRoot,
            timeoutMs
          });

          const commandLabel = safeArtifactName(action.command.join('_'));
          const stdoutArtifact = await this.contextBridge.writeArtifactText({
            sessionId: params.sessionId,
            taskId: params.taskId,
            name: `commands/${indexLabel}-${commandLabel}.stdout.log`,
            text: result.stdout
          });
          const stderrArtifact = await this.contextBridge.writeArtifactText({
            sessionId: params.sessionId,
            taskId: params.taskId,
            name: `commands/${indexLabel}-${commandLabel}.stderr.log`,
            text: result.stderr
          });
          const metaArtifact = await this.contextBridge.writeArtifactJson({
            sessionId: params.sessionId,
            taskId: params.taskId,
            name: `commands/${indexLabel}-${commandLabel}.json`,
            data: result
          });

          artifacts.push(stdoutArtifact, stderrArtifact, metaArtifact);
          actionResults.push({
            index: i,
            type: action.type,
            command: action.command,
            ...result
          });

          if (result.timedOut || result.exitCode !== 0) {
            const error = result.timedOut
              ? `Command timed out: ${action.command.join(' ')}`
              : `Command failed (exit ${result.exitCode}): ${action.command.join(' ')}`;

            const receipt = await this.contextBridge.writeArtifactJson({
              sessionId: params.sessionId,
              taskId: params.taskId,
              name: 'executor-run.json',
              data: { success: false, plan, actionResults, error }
            });
            artifacts.push(receipt);

            return {
              taskId: params.taskId,
              success: false,
              artifacts,
              output: 'Executor failed during command execution.',
              error,
              executorId: this.executorId,
              latencyMs: Date.now() - started,
              costUsd,
              inputTokens,
              outputTokens,
              modelKey: params.routing.modelKey,
              provider: params.routing.provider,
              model: params.routing.model
            };
          }
        }
      }

      const receipt = await this.contextBridge.writeArtifactJson({
        sessionId: params.sessionId,
        taskId: params.taskId,
        name: 'executor-run.json',
        data: { success: true, plan, actionResults }
      });
      artifacts.push(receipt);

      return {
        taskId: params.taskId,
        success: true,
        artifacts,
        output: `Executor completed ${plan.actions.length} actions successfully.`,
        executorId: this.executorId,
        latencyMs: Date.now() - started,
        costUsd,
        inputTokens,
        outputTokens,
        modelKey: params.routing.modelKey,
        provider: params.routing.provider,
        model: params.routing.model
      };
    } catch (error) {
      if (error instanceof BudgetBlockedError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const receipt = await this.contextBridge.writeArtifactJson({
        sessionId: params.sessionId,
        taskId: params.taskId,
        name: 'executor-run.json',
        data: { success: false, plan, actionResults, error: message }
      });
      artifacts.push(receipt);

      return {
        taskId: params.taskId,
        success: false,
        artifacts,
        output: 'Executor failed.',
        error: message,
        executorId: this.executorId,
        latencyMs: Date.now() - started,
        costUsd,
        inputTokens,
        outputTokens,
        modelKey: params.routing.modelKey,
        provider: params.routing.provider,
        model: params.routing.model
      };
    }
  }
}

export default ExecutorSwarm;
