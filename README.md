# JANUS

**Multi-Model AI Orchestration with Persistent Context and Bounded Execution**

---
<img width="757" height="375" alt="image" src="https://github.com/user-attachments/assets/7db11af1-2e6c-49a2-abe2-9917da644919" />




```

---

## Table of Contents

1. [Overview](#overview)
2. [Core Philosophy](#core-philosophy)
3. [Architecture](#architecture)
4. [Components](#components)
   - [Context Bridge](#context-bridge)
   - [Model Router](#model-router)
   - [Orchestrator](#orchestrator)
   - [CLI Interface](#cli-interface)
5. [Configuration](#configuration)
6. [Installation](#installation)
7. [Usage](#usage)
8. [Design Principles](#design-principles)
9. [Integration with External Projects](#integration-with-external-projects)
10. [Roadmap](#roadmap)
11. [Contributing](#contributing)
12. [License](#license)

---

## Overview

Janus is a multi-model AI orchestration system that routes tasks across multiple language model providers (Anthropic, OpenAI, OpenRouter), maintains persistent context across sessions via a git-backed state store, and executes work through coordinated agent swarms with observable cost tracking.

The system is named after the Roman god Janus, who possessed two faces looking in opposite directions. In this context, the multiple "faces" represent different LLM perspectives on the same problem, each trained with different architectures, data, and RLHF regimes. The valuable signal emerges from where these perspectives **disagree**, not just where they agree.

### Key Capabilities

- **Multi-Cloud Model Routing**: Intelligent provider selection across Anthropic, OpenAI, and OpenRouter based on task complexity, cost constraints, and quality requirements
- **Persistent Context Bridge**: Git-backed state management that maintains sessions, decisions, and task delegations across executions
- **Observable Execution**: Every operation reports its cost, reasoning, and provider selection before and after execution
- **Bounded Task Execution**: Following the "Karpathy Constraint" - all work happens in human-reviewable chunks with explicit approval gates
- **Cost-Aware Orchestration**: Automatic budget tracking with intelligent fallback to cheaper models when budget constraints apply

---

## Core Philosophy

Janus is built on principles documented in the [MANIFESTO.md](./MANIFESTO.md). Every agent instance receives this manifesto as part of its context.

### Disagreement Is Signal

When Claude says "this approach has security implications" and GPT says "this is standard practice," that delta is not noise. It is the most valuable information the system can provide. Janus surfaces disagreements explicitly rather than synthesizing them into false consensus.

### Show Your Work

Every proposal includes:
- **Confidence level** (0-100%)
- **Uncertainties** (what the model is not sure about)
- **Assumptions** (what is taken as given)
- **Alternatives considered** (what was rejected and why)

### Honor Constraints

When a user specifies a constraint, it is treated as inviolable. "Must use OAuth 2.0" means OAuth 2.0, not "here's why you should consider alternatives." User constraints encode decisions already made with context the model cannot see.

### Incremental Over Heroic

No thousand-line code drops. Each step is explained before execution. Human approval is required at every significant decision point. Work happens in chunks that humans can hold in their heads.

---

## Architecture

Janus operates across four conceptual layers:

```
┌──────────────────────────────────────────────────────────────┐
│ LAYER 1: STRATEGIC REASONING (Claude.ai / Opus 4.5)          │
│ Human-in-the-loop architectural decisions and planning       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ LAYER 2: COUNCIL DELIBERATION (llm-council + Model Router)   │
│ Multi-model deliberation with peer review and synthesis      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ LAYER 3: EXECUTION (Orchestrator + Agent Swarms)             │
│ Scout, Executor, and Reviewer agents with bounded tasks      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ LAYER 4: PERSISTENCE (Context Bridge + Git)                  │
│ Sessions, decisions, and task state persisted to git repo    │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CLI (src/cli.ts)                                            │
│ Parses command, initializes orchestrator                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Orchestrator (src/orchestrator.ts)                          │
│ Creates session, builds execution plan, coordinates swarms  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Model Router│  │Context Bridge│  │  Swarms     │
│ Provider    │  │ Persistence  │  │ (Future)    │
│ Selection   │  │ & Git Sync   │  │ Scout/Exec  │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Components

### Context Bridge

**Location**: `src/context-bridge/`

The Context Bridge provides persistent state management for Janus sessions, decisions, and delegated tasks. It operates against a git-backed directory (`janus-context/`) that can be synchronized across execution environments.

#### Module Structure

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces for Session, Decision, Task, CurrentFocus, and configuration |
| `read.ts` | Read operations: load sessions, decisions, tasks, and current focus state |
| `write.ts` | Write operations: create sessions, record decisions, delegate tasks, update status |
| `sync.ts` | Git synchronization: commit changes and push to remote |
| `index.ts` | Unified `ContextBridge` class exposing the complete API |

#### Type Definitions (`types.ts`)

```typescript
interface Session {
  id: string;                    // UUID
  started: string;               // ISO8601 timestamp
  ended?: string;                // Optional completion timestamp
  summary: string;               // Human-readable session description
  keyDecisions: Decision[];      // Decisions made during session
  openQuestions: string[];       // Unresolved questions
  delegatedTasks: Task[];        // Tasks spawned during session
  modelsInvolved: string[];      // Which models participated
}

interface Decision {
  id: string;
  date: string;                  // YYYY-MM-DD
  topic: string;                 // Decision subject
  decision: string;              // The actual decision made
  rationale: string;             // Why this decision was made
  madeBy: 'opus' | 'sonnet' | 'haiku' | 'council' | 'human';
  confidence: number;            // 0-100 confidence level
  alternatives: string[];        // Other options considered
}

interface Task {
  id: string;
  description: string;
  assignedTo: 'scout-swarm' | 'executor-swarm' | 'council';
  status: 'pending' | 'running' | 'complete' | 'failed';
  context: string;               // Background information
  result?: string;               // Outcome when complete
  model?: string;                // Which model executed
  duration?: number;             // Execution time in ms
  cost?: number;                 // Cost in USD
}

interface CurrentFocus {
  objective: string;             // Current high-level goal
  phase: string;                 // Implementation phase
  blockers: string[];            // Current blockers
  nextActions: string[];         // Immediate next steps
  lastUpdated: string;           // ISO8601 timestamp
}
```

#### Read Operations (`read.ts`)

```typescript
// Load a specific session by ID
loadSession(id: string): Promise<Session>

// List all session IDs in the context store
listSessions(): Promise<string[]>

// Load a decision by ID (parses markdown format)
loadDecision(id: string): Promise<Decision>

// List all decision files
listDecisions(): Promise<string[]>

// Get current focus state
getCurrentFocus(): Promise<CurrentFocus>

// Load a delegated task by ID
loadTask(id: string): Promise<Task>

// List all delegated tasks
listTasks(): Promise<Task[]>
```

#### Write Operations (`write.ts`)

```typescript
// Create a new session with auto-generated UUID
createSession(summary: string): Promise<Session>

// Save/update a session
saveSession(session: Session): Promise<void>

// Record a decision (saves as markdown + updates session)
recordDecision(sessionId: string, decision: Decision): Promise<void>

// Delegate a task to a swarm
delegateTask(task: Task): Promise<void>

// Update task status (pending -> running -> complete/failed)
updateTaskStatus(taskId: string, status: Task['status'], result?: string): Promise<void>

// Update current focus state
updateFocus(focus: Partial<CurrentFocus>): Promise<void>
```

#### Git Sync (`sync.ts`)

```typescript
// Commit all changes to git with message, optionally push
syncContext(message: string): Promise<void>

// Load git log history as array of commit lines
loadContextHistory(): Promise<string[]>
```

#### ContextBridge Class (`index.ts`)

The `ContextBridge` class unifies all operations into a single API:

```typescript
const bridge = new ContextBridge();

// Session lifecycle
const session = await bridge.createSession("Implementing OAuth integration");
await bridge.saveSession(session);
const sessions = await bridge.listSessions();

// Decision management
await bridge.recordDecision(session.id, {
  id: 'dec-001',
  date: '2025-12-18',
  topic: 'API Provider Strategy',
  decision: 'Use multi-cloud with Anthropic primary',
  rationale: 'Maximum flexibility and cost optimization',
  madeBy: 'human',
  confidence: 85,
  alternatives: ['Single provider', 'OpenRouter only']
});

// Task delegation
await bridge.delegateTask({
  id: 'task-001',
  description: 'Verify OAuth 2.0 library exists',
  assignedTo: 'scout-swarm',
  status: 'pending',
  context: 'Need passport-oauth2 for Node.js'
});

// Git sync
await bridge.sync("Session complete: OAuth research");
const history = await bridge.getHistory();
```

---

### Model Router

**Location**: `src/model-router.ts`

The Model Router implements intelligent multi-cloud provider selection. It routes API calls to the optimal provider based on task complexity, cost constraints, quality requirements, and available budget.

#### Supported Providers

| Provider | Models | Use Case |
|----------|--------|----------|
| Anthropic | Haiku, Sonnet, Opus 4.5 | Primary quality provider |
| OpenAI | GPT-4, GPT-4-Turbo | Speed and structured output |
| OpenRouter | 100+ models | Cost optimization (85-99% savings) |

#### Model Configurations

```typescript
const MODEL_CONFIGS = {
  haiku: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    costPerMTok: 0.8,        // $0.80 per million input tokens
    costPerMTokOutput: 4.0   // $4.00 per million output tokens
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
  }
};
```

#### Routing Interface

```typescript
interface RoutingDecision {
  provider: Provider;        // 'anthropic' | 'openai' | 'openrouter'
  model: string;             // Full model identifier
  rationale: string;         // Why this model was selected
  estimatedCost: number;     // Estimated cost in USD
}
```

#### Routing Logic

The `routeRequest` method implements cost-aware routing:

```typescript
const router = new ModelRouter();

const decision = await router.routeRequest(
  "Implement OAuth 2.0 authentication flow",
  "executor",
  {
    model: 'sonnet',           // Preferred model
    minQuality: 'balanced',    // 'fast' | 'balanced' | 'quality'
    maxCost: 0.10              // Maximum cost in USD
  }
);

// Returns:
// {
//   provider: 'anthropic',
//   model: 'claude-3-5-sonnet-20241022',
//   rationale: 'Quality-first routing: sonnet selected for task "executor" within budget.',
//   estimatedCost: 0.0045
// }
```

#### Budget Management

The router tracks remaining monthly budget and automatically downgrades to cheaper models when constraints apply:

```typescript
// Budget tracking
const status = router.getBudgetStatus();
// {
//   monthlyBudget: 150,
//   spent: 12.45,
//   remaining: 137.55,
//   percentageUsed: 8.3
// }

// After each operation
router.updateBudget(0.0045);

// When budget constrained, router returns cheaper alternative:
// "Budget constraint: opus ($0.1520) > remaining ($5.00). Using sonnet instead."
```

#### Provider Clients

The router manages initialized clients for each provider:

```typescript
const anthropicClient = router.getClient('anthropic');  // Anthropic SDK
const openaiClient = router.getClient('openai');        // OpenAI SDK
const openrouterClient = router.getClient('openrouter'); // OpenAI SDK with custom base URL
```

---

### Orchestrator

**Location**: `src/orchestrator.ts`

The JanusOrchestrator is the main execution engine that coordinates all components: Context Bridge for persistence, Model Router for provider selection, and agent swarms for task execution.

#### Execution Flow

```typescript
const orchestrator = new JanusOrchestrator();

// Execute a high-level task
const sessionId = await orchestrator.executeTask(
  "Implement OAuth 2.0 authentication with Google provider"
);
```

The execution flow proceeds through these steps:

1. **Session Creation**: Creates a new session in the Context Bridge
2. **Execution Plan**: Builds a multi-step plan (scout -> council -> executor)
3. **Plan Execution**: Executes each step with model routing
4. **Context Sync**: Commits all changes to git

#### Execution Plan Structure

```typescript
interface ExecutionPlan {
  id: string;
  sessionId: string;
  steps: ExecutionStep[];
  estimatedTokens: number;
  estimatedCost: number;
}

interface ExecutionStep {
  id: string;
  type: 'scout' | 'council' | 'executor';
  description: string;
  model: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result?: string;
  error?: string;
}
```

#### Current Implementation

The orchestrator currently creates a three-step plan for each task:

1. **Scout Step** (Haiku): Research and verify resources
2. **Council Step** (Sonnet): Deliberate on findings
3. **Executor Step** (Sonnet): Implement chosen approach

Each step logs:
- Provider selection rationale
- Estimated cost
- Execution status

```
🎯 Janus Orchestrator: Starting task execution
   Task: Implement OAuth 2.0 authentication

📋 Step 1: Creating session...
   ✅ Session a1b2c3d4... created

🗺️  Step 2: Creating execution plan...
   ✅ Plan created with 3 steps
   Estimated cost: $0.0135

⚙️  Step 3: Executing plan...

   [SCOUT] Research: Implement OAuth 2.0 authentication
      Provider: anthropic (claude-3-5-haiku-20241022)
      Cost: $0.000045
      Reason: Quality-first routing: haiku selected for task "scout" within budget.
      ✅ Complete

   [COUNCIL] Deliberate on research findings
      Provider: anthropic (claude-3-5-sonnet-20241022)
      Cost: $0.000135
      Reason: Quality-first routing: sonnet selected for task "council" within budget.
      ✅ Complete

   [EXECUTOR] Execute recommended approach
      Provider: anthropic (claude-3-5-sonnet-20241022)
      Cost: $0.000135
      Reason: Quality-first routing: sonnet selected for task "executor" within budget.
      ✅ Complete

💾 Step 4: Syncing context...
   ✅ Context synced to git
```

#### Additional Methods

```typescript
// List all sessions
const sessions = await orchestrator.listSessions();

// Get budget status
const budget = orchestrator.getBudgetStatus();

// Record a decision (requires active session)
await orchestrator.recordDecision({
  id: 'dec-001',
  date: '2025-12-18',
  topic: 'Provider Selection',
  decision: 'Use Anthropic as primary',
  rationale: 'Best quality for complex reasoning',
  madeBy: 'council',
  confidence: 90,
  alternatives: ['OpenAI primary', 'OpenRouter only']
});

// Delegate a task
await orchestrator.delegateTask({
  id: 'task-001',
  description: 'Verify passport-oauth2 package',
  assignedTo: 'scout-swarm',
  status: 'pending',
  context: 'Need OAuth 2.0 strategy for Express.js'
});
```

---

### CLI Interface

**Location**: `src/cli.ts`

The Janus CLI provides command-line access to the orchestration system.

#### Installation

```bash
# Development
npm run janus <command>

# After build
npm install -g .
janus <command>
```

#### Available Commands

| Command | Description |
|---------|-------------|
| `janus execute <task>` | Execute a task through the full orchestration pipeline |
| `janus sessions` | List all recorded sessions |
| `janus focus` | Display current focus state |
| `janus history` | Show git commit history from context store |
| `janus info` | Display version and help information |

#### Command Examples

```bash
# Execute a task
janus execute "Implement user authentication with JWT"

# List sessions
janus sessions
📚 Sessions (3 total):
  - a1b2c3d4... (2025-12-18T10:30:00Z)
    Implement OAuth 2.0 authentication
  - e5f6g7h8... (2025-12-17T15:45:00Z)
    Database schema design

# Show current focus
janus focus
🎯 Current Focus:
  Objective: Complete Week 1 Foundation
  Phase: Context Bridge Implementation
  Blockers: None
  Next Actions:
    • Complete unit tests
    • Deploy to staging

# View history
janus history
📜 Context Git History:
  abc1234 Session complete: OAuth research
  def5678 Decision recorded: API strategy
  ghi9012 Initial context structure
```

---

## Configuration

Configuration is managed through environment variables. See [CONFIGURATION.md](./CONFIGURATION.md) for complete documentation.

### Environment Variables

Create a `.env` file in the project root:

```bash
# API Keys (required)
ANTHROPIC_API_KEY=sk-ant-...

# API Keys (optional, recommended for multi-cloud)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
GITHUB_TOKEN=ghp_...

# Janus Configuration
JANUS_CONTEXT_PATH=./janus-context    # Path to context store
JANUS_LOG_LEVEL=debug                  # debug | info | warn | error
JANUS_BUDGET_MONTHLY=150               # Monthly budget limit in USD
JANUS_AUTO_SYNC=true                   # Auto-sync context to git

# Feature Flags
ENABLE_COST_OPTIMIZATION=true          # Enable smart model routing
ENABLE_DETAILED_LOGGING=true           # Detailed operation logging
ENABLE_MANIFESTO_INJECTION=true        # Inject manifesto into agent context
```

### Configuration Decisions

The current locked configuration (see [CONFIGURATION.md](./CONFIGURATION.md)):

| Setting | Value | Rationale |
|---------|-------|-----------|
| API Provider Strategy | Multi-Cloud | Maximum flexibility, intelligent routing |
| Monthly Budget | $100-150 | Balanced quality/cost for development |
| Scout Model | Haiku | Fast, cheap research |
| Council Model | Sonnet | Balanced deliberation |
| Executor Model | Sonnet | Quality execution |
| Strategic Layer | Opus 4.5 | Human interaction, architecture |
| Deployment | Local Docker | Full control, zero cloud cost |

---

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git (for context synchronization)
- API keys for at least one provider

### Setup

```bash
# Clone the repository
git clone https://github.com/AI-et-al/janus.git
cd janus

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Initialize context store
mkdir -p janus-context/{sessions,decisions,state/delegations}
cd janus-context && git init && cd ..

# Build
npm run build

# Run in development
npm run dev info
```

### Project Structure

```
janus/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── orchestrator.ts           # Main orchestration engine
│   ├── model-router.ts           # Multi-cloud provider routing
│   └── context-bridge/
│       ├── index.ts              # ContextBridge class
│       ├── types.ts              # TypeScript interfaces
│       ├── read.ts               # Read operations
│       ├── write.ts              # Write operations
│       └── sync.ts               # Git synchronization
├── janus-context/                # Git-backed state store
│   ├── sessions/                 # Session JSON files
│   ├── decisions/                # Decision markdown files
│   ├── state/
│   │   ├── current-focus.json    # Current focus state
│   │   └── delegations/          # Delegated task files
│   └── manifesto/
│       └── MANIFESTO.md          # Agent manifesto
├── dist/                         # Compiled output
├── MANIFESTO.md                  # Core principles
├── CONFIGURATION.md              # Configuration documentation
├── COMPONENT_ARCHITECTURE.md     # Integration guide
├── package.json
├── tsconfig.json
└── .env                          # Environment variables
```

---

## Usage

### Basic Workflow

```bash
# 1. Execute a task
janus execute "Design database schema for user management"

# 2. View the session
janus sessions

# 3. Check current focus
janus focus

# 4. Review history
janus history
```

### Programmatic Usage

```typescript
import { JanusOrchestrator } from './src/orchestrator.js';
import { ContextBridge } from './src/context-bridge/index.js';

const orchestrator = new JanusOrchestrator();
const bridge = new ContextBridge();

// Execute task
const sessionId = await orchestrator.executeTask(
  "Implement rate limiting middleware"
);

// Load result
const session = await bridge.loadSession(sessionId);
console.log(session.keyDecisions);
```

---

## Design Principles

### The Karpathy Constraint

Janus follows Andrej Karpathy's principle for AI tooling:

> "I want to mass-execute short tasks, looking at each one... I don't want the agent to go off for 20 minutes and mass-execute 50 writes."

Implementation:
- Every step is observable and logged
- User sees cost estimates before execution
- Execution happens in bounded chunks
- No autonomous extended execution without approval

### Observable Disagreement

The three-stage deliberation protocol (via llm-council integration):

1. **Stage 1: Independent Opinions** - Each model responds in parallel
2. **Stage 2: Peer Review** - Models rank each other's responses (anonymized)
3. **Stage 3: Synthesis** - Chairman model summarizes with highlighted disagreements

The system presents disagreements to the user rather than synthesizing them away.

### Persistent Context

All decisions, sessions, and task delegations persist to a git-backed store. This enables:
- Session continuity across restarts
- Decision audit trail
- Learning from past similar problems
- Multi-environment synchronization

---

## Integration with External Projects

Janus composes four production-ready projects. See [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) for complete integration details.

### llm-council

Multi-model deliberation engine implementing the three-stage protocol.
- FastAPI backend + React frontend
- OpenRouter for 100+ model access
- Council assembly and anonymized peer review

### claudelytics

Rust CLI for usage analytics and cost tracking.
- Real-time cost monitoring
- Interactive TUI session browser
- Budget alerts and optimization suggestions

### agentic-flow

Framework for specialized agents with learning.
- 54 agent types (Scout, Executor, Reviewer, etc.)
- Agent Booster: 352x faster code operations
- ReasoningBank: Persistent learning memory
- Multi-Model Router: 85-99% cost savings

### Claude Agent SDK

Anthropic's SDK for spawning and coordinating subagents.
- Bounded task execution
- Context passing between agents
- Tool integration

---

## Roadmap

### Week 1: Foundation (Current)

- [x] Context Bridge (read, write, sync)
- [x] Model Router (multi-cloud routing)
- [x] Orchestrator (session + plan execution)
- [x] CLI (5 commands)
- [ ] Unit tests (90%+ coverage)

### Week 2: Swarms

- Scout Swarm (parallel research)
- Council Swarm (3-stage deliberation)
- Executor Swarm (code execution)

### Week 3: Memory Integration

- Claude-OS learning system
- ReasoningBank pattern optimization
- Cross-layer context sync

### Week 4: Analytics

- Claudelytics cost tracking
- Performance monitoring
- Budget forecasting

### Week 5: Optimization

- Learned model selection
- Auto-topology selection
- Performance tuning

---

## Contributing

Contributions welcome. Please read the [MANIFESTO.md](./MANIFESTO.md) before contributing - the principles there apply to all contributions.

### Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev info

# Run tests
npm test

# Build
npm run build
```

### Pull Request Guidelines

1. All PRs must include tests
2. Follow the Manifesto principles
3. Document public APIs
4. Include cost estimates for LLM operations

---

## Credits

Janus is developed by **AI-et-al**.

The project integrates work from:
- **llm-council**: Multi-model deliberation protocol
- **claudelytics**: Cost tracking and analytics
- **agentic-flow**: Agent framework and learning systems
- **Anthropic Claude Agent SDK**: Subagent coordination

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <em>"The map is not the territory, but three maps from different cartographers<br>gives you a better sense of where the territory actually is."</em>
</p>
