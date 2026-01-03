# Janus Architecture Overview

Janus is a platform for orchestrating multiple language models and tool-based agents over long-horizon tasks.  Its design emphasises persistent memory, cost-aware model selection and explicit reasoning.  This document describes the current architecture, the normative principles guiding development and the phased implementation roadmap.

## Principles and motivations

- **Persistent context** - Sessions, decisions and tasks are persisted in a context store so that knowledge can be reused across runs and across machines[432503063334443 L138-L199].  Memory is treated as infrastructure rather than a feature; multiple backends (local file, `claude-mem`, cloud key-value) can be plugged in.
- **Multi-model collaboration** - Janus does not rely on a single "strategic" model.  Instead, it routes requests to multiple models based on cost and quality constraints and uses a council of advisors to surface disagreements[177272126167875 L143-L169].  The orchestrator itself performs top-level reasoning.
- **Karpathy constraint** - All operations are decomposed into small, bounded steps with observable outputs[976079008273562 L184-L257].  Costs are estimated before execution and reported afterwards.
- **Explicit disagreement and reasoning** - Agents are required to state their assumptions, uncertainties and alternatives; disagreements are exposed to the user rather than hidden[910682570583231 L6-L39].  A manifesto codifies these norms and must be included in council prompts.
- **Human control** - The user remains in charge of strategic direction.  The orchestrator asks for confirmation when ambiguities arise or when budgets may be exceeded.

## Layered architecture

Janus is organised into layered components to separate concerns and support extensibility:

1. **User interface layer** - Provides a CLI and, in the future, a web dashboard.  Users submit goals, monitor sessions and view cost reports.
2. **Orchestrator** - The top-level agent that decomposes high-level goals into an execution plan.  It delegates research, deliberation and execution tasks to swarms, tracks dependencies and updates the context store.  The orchestrator is itself model-agnostic; it uses the model router to call specific providers but does not rely on any single model for strategic control.
3. **Swarm layer** - Specialised groups of agents handle domain-specific work:
   * **Scout swarm** - Performs research and verification.  Scouts search external resources (web, package registries) and must verify and timestamp each citation.  They follow the "Draconian Scout Protocol" from the manifesto[910682570583231 L106-L133].
   * **Council swarm** - A panel of LLM advisors deliberates on questions.  Each advisor produces a structured proposal detailing reasoning, uncertainties and alternatives.  A disagreement detector highlights conflicting positions, and a synthesis step summarises consensus or requests human guidance.
   * **Executor swarm** - Executes code or multi-phase tasks in a sandbox.  Executors produce artifacts and logs under `janus-context/artifacts/<session>/<task>/` and report success or failure.  They operate in small increments and must include tests when generating code.
4. **Memory layer** - A pluggable context store persists sessions, decisions, delegated tasks and cost entries.  The current implementation uses a Git-backed file store, but adapters for `claude-mem` and cloud stores are planned[432503063334443 L138-L199].
5. **Model router** - Maintains metadata about available models (cost per token, latency, quality) and selects the optimal model for each call[177272126167875 L143-L169].  It records cost entries and enforces per-session and monthly budgets.  Learned tier snapshots can override base quality tiers as peer ratings accumulate.
   * Model freshness is refreshed via Oracle at session start for critical (council/orchestrator) keys, with audit logs and a TTL-based status record.
6. **Analytics layer** - Collects cost and performance metrics and exposes them via the CLI and forthcoming dashboards.  It integrates with external tools (Langfuse, Helicone) for deeper analysis.

## Data flow

1. **Input** - The user submits a goal (e.g., "research an emerging market and design a model hierarchy").
2. **Planning** - The orchestrator decomposes the goal into stages (research -> deliberation -> execution).  It estimates costs using the model router and asks for user confirmation if budgets may be exceeded.
3. **Execution** - The orchestrator delegates research tasks to the scout swarm, deliberation tasks to the council swarm and implementation tasks to the executor swarm.  Each call uses the model router to select providers.  Costs and decisions are persisted in the context store.
4. **Aggregation and feedback** - Results from the swarms are aggregated and summarised.  Disagreements are surfaced; the user may choose to iterate or refine the plan.  The orchestrator updates the current focus and session state and can capture peer ratings for the previous model run.
5. **Iteration** - Long-horizon goals may require multiple cycles of research, deliberation and execution.  The context store retains all state for audit and reuse.

## Implementation roadmap

Janus will evolve through phases that build on the foundation laid in Week 1:

1. **Phase 1 - Foundation**
   * Abstract the context bridge behind a storage interface; implement local file and stub memory adapters.
   * Enhance the model router to load model lists from configuration and emit cost events to analytics[177272126167875 L143-L169].
   * Consolidate type definitions into a single `types.ts`.
   * Add unit tests for the context bridge and model router.
2. **Phase 2 - Swarm implementation**
   * Replace the scout stub with real research agents using search APIs and package registries.  Implement staleness detection and verification.
   * Council swarm implemented with advisors, disagreement detection and synthesis.
   * Executor swarm implemented with plan/validate/execute loop and artifact logging.
   * Enhance the orchestrator to manage dependencies and asynchronous tasks.
3. **Phase 3 - Memory and analytics**
   * Integrate `claude-mem` as an optional memory backend.  Add summarisation functions to keep context concise while retaining essential information.
   * Connect to analytics providers (e.g., Langfuse) and build a simple `janus-dashboard` for cost and performance visualisation.
4. **Phase 4 - Adaptive planning**
   * Use large models to generate execution plans automatically, guided by historical data and success metrics.
   * Incorporate user feedback to adjust confidence thresholds and model selection.
   * Improve scalability with retries, fallback models and load balancing.

This roadmap is aspirational; each phase should be reviewed and updated as the project evolves.  All changes must adhere to the principles of explicit reasoning, cost awareness and incremental execution.
