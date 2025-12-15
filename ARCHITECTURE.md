# JANUS ARCHITECTURE

## Executive Summary

Janus keeps **Opus 4.5** (Claude in claude.ai) as the strategic brain while using **Claude Agent SDK** for parallel subagent execution. The critical innovation is the **Context Bridge**—a persistent state layer that synchronizes context between claude.ai conversations and SDK runtime.

### The Problem We're Solving

1. **claude.ai conversations are ephemeral** — context dies when the session ends
2. **Claude Agent SDK runs headless** — no interactive refinement
3. **Multi-model deliberation needs both** — strategic thinking + parallel execution

**Solution:** Opus 4.5 remains the conductor. The SDK becomes the orchestra. A shared context store bridges them.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                     DAVE (Human Conductor)                    │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    CLAUDE.AI (Opus 4.5)                       │
│                                                               │
│  • Strategic deliberation                                     │
│  • Architecture decisions                                     │
│  • Manifesto enforcement                                      │
│  • Context curation (what matters, what doesn't)              │
│  • Generates execution plans for SDK                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
                       [Context Bridge]
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                   CONTEXT STORE (Git-backed)                  │
│                                                               │
│  janus-context/                                               │
│  ├── sessions/                                                │
│  │   └── {session-id}.json       # Conversation summaries     │
│  ├── decisions/                                               │
│  │   └── {date}-{topic}.md       # Architectural decisions    │
│  ├── state/                                                   │
│  │   ├── current-focus.json      # What we're working on      │
│  │   ├── open-questions.json     # Unresolved issues          │
│  │   └── delegations.json        # Pending sub-agent tasks    │
│  ├── manifesto/                                               │
│  │   └── MANIFESTO.md            # The rules (synced)         │
│  └── artifacts/                                               │
│      └── {artifact-id}/          # Code, docs, outputs        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                   JANUS CLI (Claude Agent SDK)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              ORCHESTRATOR (Sonnet 4.5)                  │  │
│  │                                                         │  │
│  │  • Reads execution plans from context store             │  │
│  │  • Spawns and coordinates subagents                     │  │
│  │  • Writes results back to context store                 │  │
│  │  • Enforces MANIFESTO rules                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                │
│            ┌─────────────────┼─────────────────┐              │
│            ▼                 ▼                 ▼              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │  SCOUT SWARM    │ │  COUNCIL PROXY  │ │ EXECUTOR SWARM  │  │
│  │  (5× Haiku)     │ │  (Multi-model)  │ │ (10× Haiku)     │  │
│  │                 │ │                 │ │                 │  │
│  │  • Verify URLs  │ │  • Claude API   │ │  • Write code   │  │
│  │  • Check npm    │ │  • OpenAI API   │ │  • Run tests    │  │
│  │  • Find docs    │ │  • Gemini API   │ │  • Build docs   │  │
│  │  • 5 parallel   │ │  • Deliberate   │ │  • 10 parallel  │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Context Bridge Protocol

The bridge is a Git repository that both environments can access:

```typescript
// context-bridge/types.ts

interface Session {
  id: string;
  started: string;              // ISO8601
  ended?: string;
  summary: string;
  keyDecisions: Decision[];
  openQuestions: string[];
  delegatedTasks: Task[];
}

interface Decision {
  id: string;
  date: string;
  topic: string;
  decision: string;
  rationale: string;
  madeBy: 'opus' | 'council' | 'human';
}

interface Task {
  id: string;
  description: string;
  assignedTo: 'scout-swarm' | 'executor-swarm' | 'council';
  status: 'pending' | 'running' | 'complete' | 'failed';
  context: string;              // What the subagent needs to know
  result?: string;              // What it produced
}

interface CurrentFocus {
  objective: string;
  phase: string;
  blockers: string[];
  nextActions: string[];
}
```

**How it flows:**

1. We have a conversation here in claude.ai
2. At the end (or at key points), I generate a session summary + execution plan
3. You commit that to the context store
4. The SDK reads it and executes
5. SDK writes results back
6. Next conversation, I read the results and continue

### 2. Opus 4.5 Role (Strategic Layer)

The claude.ai conversation remains the strategic layer. Outputs for the SDK:

```markdown
## Execution Plan: {task-name}

### Context
{What the SDK needs to know from our conversation}

### Objective
{What we're trying to accomplish}

### Approach
{High-level strategy}

### Subtasks
1. [ ] {task} → assign to: {swarm}
2. [ ] {task} → assign to: {swarm}
3. [ ] {task} → assign to: {council}

### Constraints
- {constraint from MANIFESTO}
- {constraint from this conversation}

### Success Criteria
- {how we know it worked}
```

### 3. SDK Orchestrator (Sonnet 4.5)

Cheaper than Opus, still very capable. Reads plans, spawns agents, coordinates.

```typescript
// src/sdk/orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";
import { readContextStore, writeContextStore } from "./context-bridge";

const client = new Anthropic();

async function executeTask(taskId: string) {
  const task = await readContextStore(`state/delegations/${taskId}.json`);
  const manifesto = await readContextStore("manifesto/MANIFESTO.md");
  
  // Spawn subagents based on task type
  if (task.assignedTo === "scout-swarm") {
    const results = await runScoutSwarm(task);
    await writeContextStore(`artifacts/${taskId}/scout-results.json`, results);
  } else if (task.assignedTo === "executor-swarm") {
    const results = await runExecutorSwarm(task);
    await writeContextStore(`artifacts/${taskId}/`, results);
  } else if (task.assignedTo === "council") {
    const deliberation = await runCouncil(task);
    await writeContextStore(`artifacts/${taskId}/deliberation.json`, deliberation);
  }
  
  // Update task status
  task.status = "complete";
  await writeContextStore(`state/delegations/${taskId}.json`, task);
}
```

### 4. Scout Swarm

Five parallel Haiku instances, each with a single verification mission:

```typescript
// src/sdk/swarms/scout.ts

async function runScoutSwarm(task: Task): Promise<ScoutResult[]> {
  const queries = decomposeToSearchQueries(task);
  
  // Parallel execution
  const results = await Promise.all(
    queries.map(query => runScoutAgent(query))
  );
  
  // Merge and deduplicate
  return mergeScoutResults(results);
}

async function runScoutAgent(query: SearchQuery): Promise<ScoutResult> {
  // Each scout has the Draconian Protocol in its prompt
  const response = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: `You are a Scout agent for the Janus system.

THE GOLDEN RULE:
If you cannot provide a URL, install command, or specific citation — YOU HAVE FAILED.

For every resource you mention:
| Resource Type | Required |
|---------------|----------|
| Library/Package | npm install X or pip install X |
| API/Service | Documentation URL |
| Tool/Framework | GitHub repo or official site |

Stale Resource Detection:
- Last update > 2 years ago → Flag it: ⚠️ STALE
- Better-maintained alternative exists → Mention it

You are the reality check. Speculation is forbidden.`,
    messages: [{ role: "user", content: query.prompt }]
  });
  
  return parseScoutResponse(response);
}
```

### 5. Council Proxy

Runs the actual multi-model deliberation:

```typescript
// src/sdk/swarms/council.ts

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = new Anthropic();
const openai = new OpenAI();
const google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface Proposal {
  advisor: "claude" | "gpt" | "gemini";
  response: string;
  confidence: number;
  uncertainties: string[];
  delegations: Delegation[];
  reasoning: string;
}

export interface Deliberation {
  task: string;
  proposals: Proposal[];
  disagreements: Disagreement[];
  consensus: string | null;
  timestamp: string;
}

export async function runCouncil(task: string): Promise<Deliberation> {
  const manifesto = await getManifesto();
  const systemPrompt = buildCouncilSystemPrompt(manifesto);
  
  console.log("🏛 Convening the Council...");
  
  // Parallel calls to all three advisors
  const [claudeRaw, gptRaw, geminiRaw] = await Promise.all([
    callClaude(systemPrompt, task),
    callGPT(systemPrompt, task),
    callGemini(systemPrompt, task)
  ]);
  
  // Parse each into structured proposals
  const proposals = await Promise.all([
    parseProposal(claudeRaw, "claude"),
    parseProposal(gptRaw, "gpt"),
    parseProposal(geminiRaw, "gemini")
  ]);
  
  // Detect disagreements
  const disagreements = detectDisagreements(proposals);
  
  // Find consensus (if any)
  const consensus = findConsensus(proposals);
  
  return {
    task,
    proposals,
    disagreements,
    consensus,
    timestamp: new Date().toISOString()
  };
}
```

### 6. Executor Swarm

Ten parallel Haiku instances for implementation tasks:

```typescript
// src/sdk/swarms/executor.ts

async function runExecutorSwarm(task: Task): Promise<ExecutorResult> {
  const subtasks = decomposeToSubtasks(task);
  
  // Group by dependency (some must run sequentially)
  const phases = groupByDependency(subtasks);
  
  for (const phase of phases) {
    // Each phase runs in parallel
    const results = await Promise.all(
      phase.map(subtask => runExecutorAgent(subtask))
    );
    
    // Verify before next phase
    await verifyPhaseResults(results);
  }
  
  return assembleResults(phases);
}
```

---

## Directory Structure

```
janus/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── MANIFESTO.md
├── ARCHITECTURE.md
│
├── janus-context/                 # Context Bridge (git repo)
│   ├── .git/
│   ├── sessions/
│   ├── decisions/
│   ├── state/
│   │   ├── current-focus.json
│   │   ├── open-questions.json
│   │   └── delegations/
│   ├── manifesto/
│   │   └── MANIFESTO.md
│   └── artifacts/
│
├── src/
│   ├── cli.ts                     # Entry point
│   ├── types.ts                   # Shared types
│   │
│   ├── context-bridge/            # Context sync layer
│   │   ├── index.ts
│   │   ├── read.ts
│   │   ├── write.ts
│   │   └── sync.ts
│   │
│   ├── orchestrator/              # SDK orchestrator
│   │   ├── index.ts
│   │   ├── task-runner.ts
│   │   └── result-collector.ts
│   │
│   ├── swarms/                    # Subagent swarms
│   │   ├── scout/
│   │   │   ├── index.ts
│   │   │   ├── agent.ts
│   │   │   └── draconian-protocol.ts
│   │   ├── council/
│   │   │   ├── index.ts
│   │   │   ├── claude-advisor.ts
│   │   │   ├── gpt-advisor.ts
│   │   │   ├── gemini-advisor.ts
│   │   │   └── disagreement-detector.ts
│   │   └── executor/
│   │       ├── index.ts
│   │       ├── agent.ts
│   │       └── phase-runner.ts
│   │
│   ├── providers/                 # API clients
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   └── google.ts
│   │
│   └── utils/
│       ├── logger.ts
│       ├── cost-tracker.ts
│       └── manifesto-enforcer.ts
│
└── scripts/
    ├── sync-context.sh            # Pull/push context store
    └── run-delegations.sh         # Execute pending tasks
```

---

## Implementation Phases

### Phase 0: Prerequisites
- [ ] Create `janus-context/` directory structure
- [ ] Initialize Git repository
- [ ] Write MANIFESTO.md
- [ ] Create initial TypeScript interfaces
- [ ] Set up Claude SDK environment

### Phase 1: Context Bridge
- [ ] Implement `context-bridge.ts` with state read/write
- [ ] Create session management utilities
- [ ] Build decision logging system
- [ ] Test bidirectional sync

### Phase 2: Scout Swarm
- [ ] Implement parallel Haiku scout launcher
- [ ] Build URL validation pipeline
- [ ] Create resource verification system
- [ ] Integrate with context bridge

### Phase 3: Executor Swarm
- [ ] Implement parallel Haiku executor launcher
- [ ] Build task distribution system
- [ ] Create artifact collection pipeline
- [ ] Integrate with context bridge

### Phase 4: Council Proxy
- [ ] Add Claude adapter (Opus/Sonnet)
- [ ] Add GPT adapter (GPT-5.1/o3)
- [ ] Add Gemini adapter (Gemini 3 Pro)
- [ ] Implement deliberation protocol
- [ ] Build disagreement detection
- [ ] Create synthesis pipeline

### Phase 5: CLI & Orchestration
- [ ] Implement CLI entry point
- [ ] Build task runner
- [ ] Create result display
- [ ] Integrate all components

### Phase 6: Observable UI
- [ ] WebSocket server for real-time updates
- [ ] React frontend for Council Chamber
- [ ] Deliberation visualization
- [ ] Cost tracking display

---

## Daily Workflow (Target State)

```
Morning Session (claude.ai)
│
├─► Load previous state from janus-context/
├─► Strategic planning with Opus
├─► Define focus and tasks
├─► Commit session state
│
▼
SDK Execution (automated)
│
├─► Parse pending tasks
├─► Scout swarm verifies resources
├─► Council deliberates (if needed)
├─► Executor swarm implements
├─► Results committed to Git
│
▼
Evening Review (claude.ai)
│
├─► Load execution results
├─► Review artifacts
├─► Make strategic decisions
├─► Plan next session
└─► Commit updated state
```

---

## What Makes This Work

1. **Opus stays strategic** — Not bogged down in parallel execution
2. **SDK handles scale** — Subagent swarms do the grunt work
3. **Context persists** — Git-backed, version-controlled, syncable
4. **Manifesto enforced everywhere** — Every subagent gets the rules
5. **Results flow back** — Next session, you see what happened
6. **Disagreement surfaced** — The Council doesn't hide divergence

---

## Integration with Existing Tools

Janus is designed to work alongside—not replace—existing memory/context systems:

### Compatible With
- **claude-os**: Session management, knowledge bases, persistent memory
- **Claude Code CLI**: Local execution environment
- **MCP Servers**: Tool integration

### What Janus Adds
- Multi-model deliberation (the Council)
- Observable reasoning (see the thinking)
- Disagreement detection
- Cost transparency

The architecture is modular. Use what you need.
