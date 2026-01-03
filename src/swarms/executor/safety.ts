import type { ExecutorAction, ExecutorPlanV1 } from '../../types.js';
import * as path from 'path';

export interface ExecutorSafetyConfig {
  repoRoot: string;
  maxActions: number;
  maxCommandMs: number;
  allowedCommands: Set<string>;
  allowedGitSubcommands: Set<string>;
  maxFileBytes: number;
}

export function defaultExecutorSafety(repoRoot: string): ExecutorSafetyConfig {
  const maxActions = Number(process.env.JANUS_EXECUTOR_MAX_ACTIONS || '8');
  const maxCommandMs = Number(process.env.JANUS_EXECUTOR_MAX_COMMAND_MS || '120000');
  const maxFileBytes = Number(process.env.JANUS_EXECUTOR_MAX_FILE_BYTES || '200000');

  const allowCmds = (process.env.JANUS_EXECUTOR_ALLOW_CMDS || 'node,npm,npx,tsx,vitest,git')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const allowGit = (process.env.JANUS_EXECUTOR_ALLOW_GIT_SUBCMDS || 'status,diff,log,rev-parse,show')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  return {
    repoRoot,
    maxActions: Number.isFinite(maxActions) ? maxActions : 8,
    maxCommandMs: Number.isFinite(maxCommandMs) ? maxCommandMs : 120000,
    maxFileBytes: Number.isFinite(maxFileBytes) ? maxFileBytes : 200000,
    allowedCommands: new Set(allowCmds),
    allowedGitSubcommands: new Set(allowGit)
  };
}

export function resolveRepoPath(repoRoot: string, rel: string): string {
  if (path.isAbsolute(rel)) {
    throw new Error(`Absolute paths blocked: ${rel}`);
  }

  const abs = path.resolve(repoRoot, rel);
  const root = path.resolve(repoRoot);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error(`Path escapes repoRoot: ${rel}`);
  }

  return abs;
}

export function validateAction(action: ExecutorAction, safety: ExecutorSafetyConfig): void {
  if (action.type === 'write_file') {
    resolveRepoPath(safety.repoRoot, action.path);

    const size = Buffer.byteLength(action.content, 'utf-8');
    if (size > safety.maxFileBytes) {
      throw new Error(`write_file too large (> ${safety.maxFileBytes} bytes): ${action.path}`);
    }
    return;
  }

  if (action.type === 'run_command') {
    const [cmd, subcmd] = action.command;
    if (!cmd) {
      throw new Error('run_command missing command[0]');
    }

    if (!safety.allowedCommands.has(cmd)) {
      throw new Error(`Command not allowed by default policy: ${cmd}`);
    }

    if (cmd === 'git') {
      if (!subcmd || !safety.allowedGitSubcommands.has(subcmd)) {
        throw new Error(`git subcommand not allowed: ${subcmd || '(missing)'}`);
      }
    }

    const joined = action.command.join(' ');
    const deny = ['rm ', ' del ', 'sudo', 'mkfs', 'dd ', ':(){', 'shutdown', 'reboot'];
    if (deny.some(token => joined.includes(token))) {
      throw new Error(`Destructive pattern blocked: ${joined}`);
    }

    return;
  }

  const _exhaustive: never = action;
  return _exhaustive;
}

export function validatePlan(plan: ExecutorPlanV1, safety: ExecutorSafetyConfig): void {
  if (plan.version !== 1) {
    throw new Error(`Unsupported plan version: ${String(plan.version)}`);
  }

  if (!Array.isArray(plan.actions)) {
    throw new Error('Plan.actions must be an array');
  }

  if (plan.actions.length === 0) {
    throw new Error('Plan has zero actions');
  }

  if (plan.actions.length > safety.maxActions) {
    throw new Error(`Plan exceeds maxActions (${safety.maxActions})`);
  }

  if (!Array.isArray(plan.successCriteria)) {
    throw new Error('Plan.successCriteria must be an array');
  }

  for (const action of plan.actions) {
    validateAction(action, safety);
    if (action.type === 'run_command') {
      const timeout = action.timeoutMs ?? safety.maxCommandMs;
      if (timeout > safety.maxCommandMs) {
        throw new Error(`Command timeout exceeds policy max (${safety.maxCommandMs}ms)`);
      }
    }
  }
}
