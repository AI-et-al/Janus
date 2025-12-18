/**
 * Type definitions for Janus Context Bridge
 *
 * The Context Bridge maintains persistent state that synchronizes
 * between claude.ai (Opus 4.5) and the Claude Agent SDK runtime.
 */

export interface Session {
  id: string;
  started: string; // ISO8601
  ended?: string;
  summary: string;
  keyDecisions: Decision[];
  openQuestions: string[];
  delegatedTasks: Task[];
  modelsInvolved: string[];
}

export interface Decision {
  id: string;
  date: string;
  topic: string;
  decision: string;
  rationale: string;
  madeBy: 'opus' | 'sonnet' | 'haiku' | 'council' | 'human';
  confidence: number; // 0-100
  alternatives: string[];
}

export interface Task {
  id: string;
  description: string;
  assignedTo: 'scout-swarm' | 'executor-swarm' | 'council';
  status: 'pending' | 'running' | 'complete' | 'failed';
  context: string;
  result?: string;
  model?: string;
  duration?: number;
  cost?: number;
}

export interface CurrentFocus {
  objective: string;
  phase: string;
  blockers: string[];
  nextActions: string[];
  lastUpdated: string;
}

export interface TaskResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ContextBridgeConfig {
  contextPath: string;
  autoSync: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
