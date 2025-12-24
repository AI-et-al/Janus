# Janus Specification

## Overview

Janus is a multi-model orchestration system that routes tasks across LLM providers, persists decision context in a git-backed store, and executes work in bounded, observable steps. The system emphasizes persistent context ("Context Bridge"), cost-aware routing, and surfaced disagreement between models. The core runtime flows through the CLI (`src/cli.ts`) into the orchestrator (`src/orchestrator.ts`), which coordinates the model router (`src/model-router.ts`) and the Context Bridge (`src/context-bridge/*`). The current implementation includes a mocked swarm execution loop, with swarms planned for future milestones.

## Goals / Non-Goals

### Goals
- Multi-model routing across Anthropic, OpenAI, and OpenRouter with cost-aware selection.
- Persistent context storage for sessions, decisions, tasks, and focus state in a git-backed directory (`janus-context/`).
- Bounded, observable execution steps (Karpathy Constraint) with explicit cost estimates.
- Budget tracking and cost visibility per task/session.
- Clear integration path for council deliberation and agent swarms.

### Non-Goals
- Full swarm execution (Scout/Council/Executor) is not implemented yet; current orchestrator simulates completion.
- A full deliberation UI or analytics dashboard is out of scope for current foundation.
- Cloud deployment is not required for Week 1; the target is local Docker execution.

## Requirements

### Functional Requirements
Derived from README.md and DOCUMENTATION.md feature lists:
1. **Multi-model routing**: Route requests across Anthropic, OpenAI, and OpenRouter with model selection based on task complexity and budget (`src/model-router.ts`).
2. **Persistent context**: Store sessions, decisions, and delegated tasks in a git-backed context store (`src/context-bridge/read.ts`, `src/context-bridge/write.ts`).
3. **Bounded execution**: Orchestrator should execute tasks in discrete steps (scout → council → executor) with visible progress (`src/orchestrator.ts`).
4. **Observable execution**: Every step should log model selection, cost estimate, and rationale (`src/orchestrator.ts`).
5. **Cost tracking**: Maintain monthly budget, update spend per operation, and expose current budget status (`src/model-router.ts`).
6. **Context sync**: Persist context changes via git commit (and optional push) (`src/context-bridge/sync.ts`).
7. **CLI access**: Provide commands to execute tasks, list sessions, show focus, and show history (`src/cli.ts`).

### Non-Functional Requirements
Derived from CONFIGURATION.md:
1. **Budget constraints**: Enforce a $100–150/month budget with a $150 hard limit, including per-operation cost estimation (`JANUS_BUDGET_MONTHLY`).
2. **Logging**: Structured, detailed logging for sessions, decisions, routing, and cost visibility; errors/warnings must be logged (console + file logs in `logs/`).
3. **Deployment**: Local Docker deployment target for Weeks 1–4; cloud migration deferred.
4. **Testing**: Unit + integration tests with high coverage (90%+), especially for Context Bridge operations and routing logic.
5. **Configuration via environment**: .env-based API keys and configuration toggles (e.g., `ENABLE_COST_OPTIMIZATION`, `JANUS_LOG_LEVEL`).

## Architecture Decisions

### Layered Architecture (from ARCHITECTURE.md and DOCUMENTATION.md)
- **Strategic layer**: Human-in-the-loop planning via Opus 4.5 in claude.ai.
- **Council deliberation**: Multi-model review (planned integration with llm-council).
- **Execution**: Orchestrator coordinates bounded steps and (future) swarms.
- **Persistence**: Context Bridge + git-backed store to synchronize sessions, decisions, and tasks across environments.

### Context Bridge Design
- **Rationale**: Synchronize claude.ai strategic context with SDK/runtime execution, ensuring persistent memory across sessions.
- **Mechanism**: `janus-context/` repo with sessions, decisions, state, and artifacts, with git sync for portability (`src/context-bridge/sync.ts`).

### Component Responsibilities (from COMPONENT_ARCHITECTURE.md)
- **llm-council**: Multi-stage deliberation protocol with explicit disagreement surfacing.
- **agentic-flow**: Provides swarm execution patterns, model routing, and learning/ReasoningBank storage.
- **claudelytics**: Cost tracking and reporting.
- **Claude Agent SDK**: Subagent orchestration under bounded execution constraints.

### Locked Configuration Decisions (from CONFIGURATION.md)
- **Provider strategy**: Multi-cloud (Anthropic primary, OpenAI secondary, OpenRouter tertiary).
- **Budget**: $100–150/month with $150 hard limit.
- **Logging**: Detailed, structured JSON logs.
- **Deployment target**: Local Docker.
- **Model tiers**: Scout = Haiku, Council = Sonnet, Executor = Sonnet, Strategic layer = Opus 4.5.
- **Testing**: Unit + integration tests using Vitest.

## Data Models

### Primary Domain Types (src/types.ts)
- **Session**: Core session metadata with decisions, open questions, delegated tasks.
- **Decision**: Includes timestamp, topic, decision/rationale, alternatives, reversible flag.
- **Task**: Includes assigned swarm, status, dependencies, artifacts, result/error.
- **CostEntry / SessionCosts**: Per-operation cost tracking and rollups.
- **JanusConfig**: Model selection, cost thresholds, and logging.
- **Council/Swarm types**: Proposal, Delegation, Disagreement, Scout/Executor results.

### Context Bridge Types (src/context-bridge/types.ts)
- **Session**: Adds `modelsInvolved` for session context.
- **Decision**: Includes `date`, `madeBy`, `confidence`, and `alternatives`.
- **Task**: Includes `model`, `duration`, and `cost` fields; status values differ.
- **CurrentFocus**: Includes `lastUpdated` as required.

### Overlaps & Canonicalization
- **Decision differences**: `timestamp` vs `date`, `reversible` vs `confidence` + `alternatives`, `madeBy` enumeration differences.
- **Task differences**: `status` enums differ (`active/blocked` vs `running`), context/metadata fields differ.
- **Canonical choice**:
  - **Persistence canonical**: `src/context-bridge/types.ts` is canonical for on-disk session, decision, task, and focus records because all read/write paths in `src/context-bridge/*` are typed against it.
  - **System-wide types**: `src/types.ts` is canonical for orchestration, council, swarm, and cost tracking concerns that are not stored in the context repo.
  - **Spec alignment**: Use Context Bridge types for persisted data and explicitly map differences if/when adopting `src/types.ts` fields in persistence.

## System Flows

### End-to-End Task Execution (Current Behavior)
1. **CLI** (`src/cli.ts`): `janus execute "<task>"` loads env config and invokes orchestrator.
2. **Orchestrator** (`src/orchestrator.ts`):
   - Creates a new session in Context Bridge.
   - Builds a 3-step execution plan: scout → council → executor.
   - Uses Model Router to select providers and estimate cost.
   - Executes steps in sequence with mocked completion.
3. **Model Router** (`src/model-router.ts`):
   - Estimates token usage and selects model/provider based on budget.
   - Updates budget after each step.
4. **Context Bridge** (`src/context-bridge/write.ts`, `src/context-bridge/read.ts`):
   - Persists session data and decisions (when recorded).
5. **Git Sync** (`src/context-bridge/sync.ts`):
   - Commits context changes to the `janus-context/` repo and attempts push.

### Context Bridge Read/Write/Sync Lifecycle
- **Write**: `createSession`, `saveSession`, `recordDecision`, `delegateTask`, `updateFocus`.
- **Read**: `loadSession`, `listSessions`, `loadDecision`, `listDecisions`, `getCurrentFocus`, `loadTask`, `listTasks`.
- **Sync**: `syncContext` commits/pushes state; `loadContextHistory` surfaces git history for CLI.

### Planned Capabilities
- Replace mocked plan execution with swarm execution via agentic-flow.
- Council deliberation to call llm-council stages 1–3.
- Executor swarm to generate artifacts and update task statuses with real results.

## Integrations / Dependencies

- **Anthropic SDK** (`@anthropic-ai/sdk`): Primary model provider.
- **OpenAI SDK** (`openai`): Secondary provider and OpenRouter client.
- **OpenRouter**: API gateway for additional model access (planned).
- **Git**: Required for context sync in `janus-context/`.
- **External systems** (planned):
  - **llm-council** for deliberation protocol.
  - **agentic-flow** for swarm execution and routing.
  - **claudelytics** for cost analytics and reporting.

## Testing Strategy

### Coverage Expectations (CONFIGURATION.md)
- **Unit tests**: Context Bridge read/write/sync, model router selection logic, cost tracking.
- **Integration tests**: CLI command execution, git sync operations, orchestrator plan execution.
- **Coverage target**: 90%+.
- **Framework**: Vitest.

### Existing Tests
- Context Bridge tests: `src/context-bridge/__tests__/context-bridge.test.ts`.

### Gaps
- CLI command tests (`src/cli.ts`).
- Orchestrator execution tests (`src/orchestrator.ts`).
- Model router routing and budget enforcement tests (`src/model-router.ts`).
- Integration tests for git sync operations (`src/context-bridge/sync.ts`).

## Open Questions
- How should `src/types.ts` and `src/context-bridge/types.ts` be reconciled long-term (single source of truth vs. explicit mapping)?
- Should decision metadata include both `timestamp` and `date` for audit vs. human-readable ordering?
- What is the minimum viable interface for real swarm execution (mock vs. first integration)?
- Which system will be the canonical source for cost tracking (ModelRouter vs. claudelytics)?
- When should Council deliberation be invoked by default vs. on-demand?

## Verification Checklist

- [ ] Spec reflects terminology and scope from README.md, ARCHITECTURE.md, DOCUMENTATION.md.
- [ ] Requirements cover multi-model routing, persistent context, bounded execution, cost tracking.
- [ ] Architecture decisions align with Context Bridge design and component responsibilities.
- [ ] Data models reconcile overlaps between `src/types.ts` and `src/context-bridge/types.ts`.
- [ ] System flows align with `src/cli.ts`, `src/orchestrator.ts`, `src/model-router.ts`, and context bridge modules.
- [ ] Testing strategy matches CONFIGURATION.md guidance and identifies gaps.
