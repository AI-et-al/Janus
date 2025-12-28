/**
 * Janus Type Definitions
 * Core interfaces for the multi-model orchestration system
 */

// =============================================================================
// Context Bridge Types
// =============================================================================

export interface Session {
  id: string;
  started: string;              // ISO8601
  ended?: string;
  summary: string;
  keyDecisions: Decision[];
  openQuestions: string[];
  delegatedTasks: Task[];
  modelsInvolved: string[];     // Models used during this session
}

export interface Decision {
  id: string;
  date: string;                 // Human-readable (YYYY-MM-DD)
  timestamp: string;            // ISO8601 precise timestamp
  topic: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  madeBy: 'opus' | 'sonnet' | 'haiku' | 'council' | 'human';
  reversible: boolean;
  confidence: number;           // 0-100
}

export interface Task {
  id: string;
  description: string;
  assignedTo: 'scout-swarm' | 'executor-swarm' | 'council';
  status: 'pending' | 'running' | 'blocked' | 'complete' | 'failed';
  context: string;
  dependencies: string[];
  artifacts: string[];
  result?: string;
  error?: string;
  model?: string;               // Model used for execution
  duration?: number;            // Execution time in ms
  cost?: number;                // Cost in USD
}

export interface CurrentFocus {
  objective: string;
  phase: string;
  blockers: string[];
  nextActions: string[];
  lastUpdated: string;          // ISO8601, required
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

// =============================================================================
// Council Types
// =============================================================================

export type AdvisorId = 'claude' | 'gpt' | 'gemini';

export interface Proposal {
  advisor: AdvisorId;
  response: string;
  confidence: number;          // 0-100
  uncertainties: string[];
  assumptions: string[];
  alternatives: Alternative[];
  delegations: Delegation[];
  reasoning: string;
  tokenCount: number;
  cost: number;                // USD
  latencyMs: number;
}

export interface Alternative {
  description: string;
  rejectionReason: string;
}

export interface Delegation {
  task: string;
  targetSwarm: 'scout-swarm' | 'executor-swarm';
  rationale: string;
}

export interface Disagreement {
  topic: string;
  positions: {
    advisor: AdvisorId;
    position: string;
    confidence: number;
  }[];
  severity: 'minor' | 'moderate' | 'significant';
  resolution?: string;
}

export interface Deliberation {
  id: string;
  task: string;
  proposals: Proposal[];
  disagreements: Disagreement[];
  consensus: string | null;
  synthesizedAnswer?: string;
  totalTokens: number;
  totalCost: number;
  timestamp: string;
}

// =============================================================================
// Swarm Types
// =============================================================================

export interface ScoutQuery {
  id: string;
  description: string;
  searchTerms: string[];
  resourceType?: 'package' | 'api' | 'tool' | 'documentation';
}

export interface VerifiedResource {
  name: string;
  type: 'package' | 'api' | 'tool' | 'documentation';
  url: string;
  installCommand?: string;
  lastUpdated?: string;
  isStale: boolean;
  staleReason?: string;
  alternative?: string;
}

export interface ScoutResult {
  queryId: string;
  resources: VerifiedResource[];
  warnings: string[];
  scoutId: string;
  latencyMs: number;
}

export interface ExecutorTask {
  id: string;
  description: string;
  phase: number;
  dependencies: string[];
  context: string;
}

export interface ExecutorResult {
  taskId: string;
  success: boolean;
  artifacts: string[];
  output: string;
  error?: string;
  executorId: string;
  latencyMs: number;
}

// =============================================================================
// Cost Tracking
// =============================================================================

export interface CostEntry {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  operation: string;
}

export interface SessionCosts {
  sessionId: string;
  entries: CostEntry[];
  totalCost: number;
  byModel: Record<string, number>;
  byOperation: Record<string, number>;
}

// =============================================================================
// Configuration
// =============================================================================

export interface JanusConfig {
  contextRoot: string;
  models: {
    council: {
      claude: string;
      gpt: string;
      gemini: string;
    };
    orchestrator: string;
    swarm: string;
  };
  costs: {
    trackCosts: boolean;
    maxSessionCost: number;
    warnThreshold: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    debugApi: boolean;
  };
}
