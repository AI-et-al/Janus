# CLAUDE.md — AI Assistant Guide for Janus

This document provides context for AI assistants (Claude, GPT, Gemini, etc.) working on the Janus project.

---

## What Is Janus?

Janus is a **multi-model AI deliberation system** that queries multiple frontier language models (Claude, GPT, Gemini) in parallel and surfaces their **disagreements** as valuable signal rather than noise.

The core insight: When different models disagree on an answer, that disagreement reveals uncertainty in the problem space—which is often more valuable than any single confident answer.

### Key Metaphor
Instead of asking one oracle for "the answer," Janus convenes a Council of three advisors who:
- Each provide their own proposal
- State their confidence level
- List their uncertainties
- Show alternatives they considered

You (the human) see where they agree, where they diverge, and make informed decisions based on the **shape of the uncertainty**.

---

## Project Philosophy

### 1. The Karpathy Constraint
From the README:
> *"I want to mass-execute short tasks, looking at each one... I don't want the agent to go off for 20 minutes and mass-execute 50 writes."*

**Implementation guideline:**
- Work in small, observable chunks
- Human approval at every significant decision
- No thousand-line code drops
- Transparency over impressiveness

### 2. Constraints Are Sacred
From the MANIFESTO (see `MANIFESTO.md:30-35`):
> When the human specifies a constraint, treat it as **sacred**:
> - "Must use OAuth 2.0" means OAuth 2.0, not "here's why you should consider alternatives"

**Implementation guideline:**
- Respect user constraints without offering "better" alternatives
- The human has context you don't—trust their requirements
- Work within constraints, don't negotiate around them

### 3. Disagreement Is Signal
The Council doesn't vote or synthesize into consensus mush. It **surfaces disagreements** because that's where the interesting information lives.

**Implementation guideline:**
- When you disagree with another approach, state it explicitly
- Don't hedge into false consensus
- Your uncertainty is valuable data

### 4. The Draconian Scout Protocol
From the MANIFESTO (see `MANIFESTO.md:37-47`):
> If you cannot provide a working URL or install command, **do not mention the resource**. Speculation is forbidden. Hallucination is betrayal.

**Implementation guideline:**
- Verify every external resource you reference
- Libraries need working install commands
- APIs need valid documentation URLs
- No hallucinated packages or fake links

---

## Architecture Overview

Janus has two execution layers connected by a **Context Bridge**:

```
┌─────────────────────────────────────────────────┐
│  STRATEGIC LAYER (claude.ai + Opus 4.5)         │
│  - Architecture decisions                       │
│  - Strategic planning                           │
│  - Context curation                             │
└─────────────────────────────────────────────────┘
                     │
              [Context Bridge]
              (Git-backed state)
                     │
┌─────────────────────────────────────────────────┐
│  EXECUTION LAYER (Claude Agent SDK)             │
│  - Orchestrator (Sonnet 4.5)                    │
│  - Scout Swarm (5× Haiku)                       │
│  - Council Proxy (Opus/GPT/Gemini)              │
│  - Executor Swarm (10× Haiku)                   │
└─────────────────────────────────────────────────┘
```

### The Context Bridge
A Git repository at `janus-context/` that persists:
- **Sessions**: Conversation summaries and decisions
- **State**: Current focus, open questions, pending tasks
- **Artifacts**: Generated code, docs, outputs
- **Manifesto**: The rules (synced everywhere)

This allows strategic planning to survive browser closures and flow into automated execution.

---

## Project Structure

```
janus/
├── README.md                 # Vision, problem statement, philosophy
├── ARCHITECTURE.md           # Full technical design (read this!)
├── MANIFESTO.md             # Rules for all subagents
├── CLAUDE.md                # This file
├── LICENSE                  # MIT
│
├── package.json             # TypeScript project, npm scripts
├── tsconfig.json
├── .env.example             # API key templates (3 providers)
│
├── assets/                  # Janus visual branding
│   └── banner.png
│
├── janus-context/           # Context Bridge (Git-backed)
│   ├── sessions/            # Conversation summaries
│   ├── decisions/           # Architectural decisions
│   ├── state/               # Current focus, delegations
│   │   ├── current-focus.json
│   │   └── open-questions.json
│   ├── manifesto/           # MANIFESTO.md (synced)
│   └── artifacts/           # Generated outputs
│
└── src/                     # TypeScript source (mostly TODO)
    ├── cli.ts               # Entry point (skeleton exists)
    ├── types.ts             # TypeScript interfaces
    ├── context-bridge/      # TODO: State read/write
    ├── orchestrator/        # TODO: Task coordination
    ├── swarms/              # TODO: Scout/Council/Executor
    │   ├── scout/
    │   ├── council/
    │   └── executor/
    ├── providers/           # TODO: API clients
    └── utils/               # TODO: Logging, cost tracking
```

---

## Key Files to Read

Before making significant changes:

1. **README.md** — Understand the vision and problem being solved
2. **ARCHITECTURE.md** — Full technical design, component details, workflow
3. **MANIFESTO.md** — Rules enforced on all subagents (including you!)
4. **src/types.ts** — TypeScript interfaces for the system

---

## Development Status

### ✅ What Exists
- [x] Vision and architecture documentation
- [x] TypeScript project scaffold
- [x] Context Bridge design
- [x] MANIFESTO (subagent rules)
- [x] CLI skeleton (`src/cli.ts`)
- [x] Type definitions (`src/types.ts`)

### ⬜ What's Missing
- [ ] Context Bridge implementation (`src/context-bridge/`)
- [ ] Council deliberation protocol (`src/swarms/council/`)
- [ ] Multi-model API adapters (`src/providers/`)
- [ ] Disagreement detection algorithm
- [ ] Scout swarm (`src/swarms/scout/`)
- [ ] Executor swarm (`src/swarms/executor/`)
- [ ] Observable deliberation UI
- [ ] Cost tracking

---

## Working with This Codebase

### When Adding Features

1. **Read ARCHITECTURE.md** — Understand where your feature fits
2. **Check MANIFESTO.md** — Ensure you're following the rules
3. **Start small** — Follow the Karpathy principle (observable chunks)
4. **Update types** — TypeScript interfaces in `src/types.ts`
5. **Document decisions** — Add to `janus-context/decisions/` if significant

### When Implementing Council Protocol

See `ARCHITECTURE.md:284-317` for the full Council implementation pattern. Key points:
- Parallel API calls to Claude, GPT, Gemini
- Structured proposal parsing with confidence levels
- Disagreement detection (don't hide divergence!)
- Results flow to Context Bridge for persistence

### When Writing Subagents

Every subagent receives the MANIFESTO. Your implementation must:
- Show confidence levels and uncertainties
- Honor user constraints without renegotiation
- Verify external resources (Draconian Scout Protocol)
- Work in incremental chunks
- Fail transparently when needed

### Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with API keys for:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - GOOGLE_API_KEY

# Run CLI (when implemented)
npm run dev
```

---

## API Keys Required

For full Council functionality:

| Provider | Get Keys | Env Variable |
|----------|----------|--------------|
| Anthropic (Claude) | https://console.anthropic.com/ | `ANTHROPIC_API_KEY` |
| OpenAI (GPT) | https://platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Google (Gemini) | https://aistudio.google.com/apikey | `GOOGLE_API_KEY` |

Note: Claude-only works for Scout and Executor swarms.

---

## Important TypeScript Types

See `src/types.ts` for the full definitions. Key interfaces:

```typescript
// Session tracking
interface Session {
  id: string;
  started: string;
  ended?: string;
  summary: string;
  keyDecisions: Decision[];
  openQuestions: string[];
  delegatedTasks: Task[];
}

// Council deliberation
interface Proposal {
  advisor: "claude" | "gpt" | "gemini";
  response: string;
  confidence: number;           // 0-100
  uncertainties: string[];      // What they're unsure about
  delegations: Delegation[];
  reasoning: string;
}

interface Disagreement {
  topic: string;
  positions: ProposalSnippet[];
  severity: "minor" | "moderate" | "significant";
}

// Task delegation
interface Task {
  id: string;
  description: string;
  assignedTo: 'scout-swarm' | 'executor-swarm' | 'council';
  status: 'pending' | 'running' | 'complete' | 'failed';
  context: string;
  result?: string;
}
```

---

## The Council Deliberation Protocol

From `ARCHITECTURE.md:284-317`, the Council protocol:

1. **Parallel Query**: Same prompt to Claude, GPT, Gemini simultaneously
2. **Structured Response**: Each advisor returns:
   - Proposal
   - Confidence level (0-100%)
   - Uncertainties (what they don't know)
   - Alternatives considered and rejected
   - Reasoning
3. **Disagreement Detection**: Identify where models diverge
4. **Present to Human**: Show all three perspectives + disagreements
5. **No Forced Consensus**: The Council doesn't vote or synthesize

**Key point:** Disagreements are the product, not a bug to fix.

---

## Swarm Roles

### Scout Swarm (Haiku × 5)
- **Purpose**: Verify URLs, packages, resources
- **Constraint**: No speculation—verified facts only
- **Execution**: Parallel (5 concurrent scouts)
- **Output**: Verification status, working links/commands

### Executor Swarm (Haiku × 10)
- **Purpose**: Implement bounded tasks
- **Constraint**: No creative deviation from plan
- **Execution**: Parallel (10 concurrent executors)
- **Output**: Code, tests, artifacts

### Council (Opus/GPT-4/Gemini Pro)
- **Purpose**: Strategic deliberation
- **Constraint**: Full reasoning exposure, explicit disagreements
- **Execution**: Parallel (3 advisors)
- **Output**: Structured proposals with confidence/uncertainty

### Orchestrator (Sonnet 4.5)
- **Purpose**: Coordinate subagent swarms
- **Constraint**: Enforce MANIFESTO rules
- **Execution**: Sequential task management
- **Output**: Aggregated results

---

## Communication Format for Council

When responding as a Council member, use this format (from `MANIFESTO.md:111-130`):

```markdown
## Proposal

[Your actual proposal here]

## Confidence: [0-100]%

## Uncertainties
- [Thing you're not sure about]
- [Another thing]

## Assumptions
- [What you're taking as given]

## Alternatives Considered
- [Option you rejected]: [Why]

## Delegation Suggestions
- [If any tasks should go to scouts/executors]
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This
- Offer alternatives when user specified a constraint
- Hide disagreements to appear more confident
- Reference libraries without verified install commands
- Make 1,000-line code changes at once
- Hallucinate URLs or package names
- Continue silently after errors

### ✅ Do This
- Respect constraints as sacred
- Surface disagreements explicitly
- Verify every external resource
- Work in observable chunks
- Fail transparently with "I don't know" when needed
- Follow the MANIFESTO (every subagent gets this)

---

## Next Implementation Priorities

According to `ARCHITECTURE.md:420-466`, the implementation phases:

**Phase 1: Context Bridge** (highest priority)
- Implement state read/write to `janus-context/`
- Session management utilities
- Decision logging system

**Phase 2: Council Proxy**
- API adapters for Claude, GPT, Gemini
- Deliberation protocol implementation
- Disagreement detection algorithm

**Phase 3: Scout Swarm**
- Parallel Haiku launcher
- URL/package verification pipeline
- Draconian Protocol enforcement

**Phase 4: Executor Swarm**
- Parallel task distribution
- Artifact collection
- Test execution

---

## Questions or Clarifications?

1. **Read the source docs first**: README.md, ARCHITECTURE.md, MANIFESTO.md
2. **Check existing types**: `src/types.ts`
3. **Ask the human**: They have context you don't—respect their constraints

---

## The Name

**Janus**: Roman god of doorways, beginnings, transitions. Two faces—one looking back, one looking forward.

Also: Two faces represent multiple perspectives on the same reality. Different models, different views, same underlying truth. That's what multi-model deliberation gives you.

---

*"The map is not the territory, but three maps from different cartographers gives you a better sense of where the territory actually is."*
