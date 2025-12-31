# Evaluation of Janus Codebase and Documentation (Dec 2025)

## Current code and documentation

| Component | What exists | Comments |
|---|---|---|
| **Context bridge** (`src/context-bridge/`) | A file-backed session/decision/task store with read/write functions and a small CLI for listing sessions or updating focus. It persists sessions, decisions and delegated tasks in a `janus-context/` directory and syncs via `git`[640698316418031 L13-L31][30700432933886 L10-L23]. | Works for basic persistence; type definitions are duplicated between `src/types.ts` and context bridge types, but the canonical version has been unified in `src/types.ts`. Still uses local filesystem rather than the cross-session memory described in the vision (e.g., `claude-mem`). |
| **Model router** (`src/model-router.ts`) | Instantiates Anthropic and OpenAI clients, defines cost table per model (Haiku, Sonnet, Opus, GPT-4), routes requests to the cheapest model that still meets the requested quality and budget constraints and records cost entries[177272126167875 L33-L64][177272126167875 L143-L169]. Provides budget status and persists cost entries to the context store[177272126167875 L249-L265]. | A good starting point for multi-cloud routing. Lacks integration with a central cost analytics system (e.g., `claudelytics` or `langfuse`). Only supports a few Anthropic/OpenAI models and doesn't handle dynamic model lists or user-defined preferences. |
| **Orchestrator** (`src/orchestrator.ts`) | Creates a session, constructs a simple three-step plan (scout -> council -> executor) and runs each step sequentially with a placeholder `scoutSwarm` implementation. Estimates cost for each step using the model router and updates the budget[628262332309540 L46-L173]. | The flow is mostly mocked: scout swarm returns random data and there is no council or executor implementation. No asynchronous coordination, no hierarchical delegation. |
| **Scout swarm** (`src/swarms/scout/index.ts`) | A stub that simulates research tasks by returning fake results after a random delay[396658108466203 L36-L81]. | Useful for testing concurrency but lacks actual research (e.g., no web search, package verification or doc retrieval). |
| **Council swarm** | **Missing**. Only type definitions exist for proposals, alternatives, delegations and disagreements[308752172079393 L72-L117]. | The docs describe a multi-model deliberation protocol with explicit disagreements (MANIFESTO) and a three-stage process from `llm-council`, but there is no implementation. |
| **Executor swarm** | **Missing**. Type definitions describe tasks with phases and artifacts[308752172079393 L152-L167]. | Should handle multi-phase execution (e.g., code writing, environment setup, testing) but there is no code. |
| **CLI** (`src/cli.ts`) | Provides commands `execute`, `hello`, `info`, `sessions`, `focus` and `history`. The `execute` command triggers the orchestrator and prints budget status[236753559958801 L25-L44]. | Good start but doesn't expose advanced features (cost reports, task status listing). |
| **Documentation & specs** | README.md, ARCHITECTURE.md, DOCUMENTATION.md and COMPONENT_ARCHITECTURE.md describe ambitious goals: persistent cross-session memory via `claude-mem`, a multi-model council with disagreement surfacing, cost tracking via `claudelytics`, and swarms for research/execution. They include diagrams and design principles[976079008273562 L184-L257][352237719858589 L16-L81]. | The vision is clear and compelling but diverges from the actual implementation. Many modules (council, executor, analytics, memory integration, dashboards) are described but absent. |
| **Configuration** (`CONFIGURATION.md`) | Specifies locked week-1 configuration: multi-cloud provider strategy, monthly budget, model assignments, local deployment, logging, testing, etc. It also includes an implementation timeline and success metrics[627454295868870 L146-L175]. | Useful baseline for early development; emphasises cost, testing and deployment details. However, some decisions (e.g., `ENABLE_MANIFESTO_INJECTION`, `ENABLE_DETAILED_LOGGING`) are not reflected in code. |
| **Spec & review notes** (`spec.md`, `REVIEW_NOTES.md`) | Summarises requirements, data models, system flows and open questions. Review notes highlight unresolved items like council deliberation strategy and testing gaps[257211129065276 L90-L116][761707759941775 L27-L38]. | Helpful for tracking progress and ensuring alignment. |
| **Manifesto** (`MANIFESTO.md`) | Defines rules for council and swarms: state disagreements explicitly, show your work, honour constraints, verify resources before citing them, cost consciousness, incremental execution etc[910682570583231 L6-L39][910682570583231 L106-L133]. | This is a strong normative guide that any implementation should respect. |

### Summary of gaps

1. **Swarm implementation** - only the scout swarm is a stub; there is no council or executor swarm. The system cannot yet support hierarchical delegation or long-horizon tasks.
2. **Multi-model deliberation** - the council described in docs (multi-model, explicit disagreements, reasoning exposures) has no code. There is no integration with `llm-council` or any models other than Anthropic/OpenAI via the model router.
3. **Cross-session memory** - the current persistence uses a local file store. `claude-mem` is not integrated, so there is no federated memory across sessions or cross-instance memory.
4. **Cost analytics** - the model router tracks costs in memory and can persist them to the context store, but there is no integration with an analytics UI or external tools (e.g., Langfuse, Helicone). `claudelytics` is not used.
5. **Type duplication & spec mismatch** - `src/types.ts` and context-bridge types have been partially reconciled, but some fields (task statuses, model IDs) still differ. Many structures described in docs (e.g., ReasoningBank, summarization) aren't represented in code.
6. **Testing** - minimal tests exist, leaving many modules untested. The CLI and orchestrator have no tests, and there is no integration testing.

## Recommendations

### What to keep

- **Context bridge**: The current file-backed persistence system is simple and effective for local development. Keep it as a fallback but abstract it behind an interface to allow other memory providers.
- **Model router**: The cost-aware routing logic and budget tracking provide a solid foundation. Keep the architecture but extend it to support dynamic model lists and integrate with a budgeting analytics service.
- **Manifesto & normative rules**: The MANIFESTO sets cultural expectations for the system (disagreement surfacing, cost consciousness). It should continue to be injected into council prompts and enforced in code.
- **Basic CLI structure**: The CLI skeleton is useful; expand it with additional commands (e.g., cost reports, task status, council summaries).
- **Karpathy constraint & incremental execution**: The design principle of small, bounded steps should remain central; long-horizon tasks must be decomposed into visible, verifiable sub-tasks.

### What can go (or be deferred)

- **Animated GIF & heavy banner assets**: They add size to the repository without functional value. Replace them with lightweight vector assets or host them externally.
- **Hard-coded model names in model router**: Instead of enumerating specific models in code, load model configurations from a config file or environment to support future models.
- **Git-sync in critical path**: Syncing after every operation may slow down tasks. Decouple git sync into a background job or allow batched commits.
- **Over-detailed early docs**: While the long-term vision is valuable, documentation should reflect the current implementation and planned milestones. Remove sections that promise features far beyond the current scope or clearly mark them as future work.

### What is needed for long-horizon, multi-model coordination

1. **Pluggable memory backend**: Implement an abstraction for context storage with adapters for:
   - local file store (current `janus-context`)
   - `claude-mem` (for cross-session memory, user-controlled retention)
   - cloud key-value store (e.g., Redis or DynamoDB) for scalability.
   This allows persistent memory across sessions and deployments.

2. **Real council swarm**:
   - Build a `CouncilSwarm` class that orchestrates parallel calls to several advisors (e.g., Anthropic Opus 4, OpenAI GPT-5, Google Gemini) via the model router.
   - Implement the three-stage deliberation protocol described in `llm-council`: each advisor produces a proposal with confidence, uncertainties, assumptions and alternatives; disagreements are detected and surfaced; a synthesis step attempts to form a consensus or highlight irreconcilable differences.
   - The council should adhere to the manifesto (explicit disagreement, show your work). Use structured prompts and enforce reply sections (e.g., headings). If the advisors disagree significantly or confidence is low, the orchestrator should ask the user for clarification or spawn more research tasks.

3. **Real scout swarm**:
   - Replace the stub with calls to research tools. For example, integrate `serper.dev` or `google-custom-search` for web queries, `npm`/`pip` APIs for package verification and GitHub API for repository checks. Each scout agent should return structured results (e.g., {resource, type, verification}).
   - Use `agentic-flow` or similar to spawn multiple scouts concurrently and aggregate their results.
   - Provide staleness detection (last update, popularity) and alternative suggestions as mandated by the manifesto.

4. **Executor swarm**:
   - Design a multi-phase execution pipeline. Each `ExecutorTask` includes a phase and dependencies[308752172079393 L152-L167]. Use specialized executors: code generation (using LLM), code execution (running in a sandbox), test evaluation, summarization etc. Each executor should have a well-defined contract: given a task description and context, produce an artifact or failure with logs.
   - Leverage `agentic-flow` to manage concurrency and dependencies. Support cancellation and retries when tasks fail or budgets are exceeded.

5. **Hierarchical task decomposition**:
   - For long-horizon goals (e.g., "research a market, find an under-developed niche, then design a hierarchy of models to tackle it"), the orchestrator must break the high-level goal into subtasks. Initially this can be a simple static plan (e.g., research -> ideate niches -> evaluate niches -> define model hierarchy), but long-term it should call an LLM planner to suggest decomposition strategies.
   - Each subtask should be delegated to the appropriate swarm (scout, council, executor). The orchestrator monitors completion, tracks dependencies and aggregates results into a final report.

6. **Cost & performance analytics**:
   - Persist all `CostEntry` records to the context store and optionally send them to an analytics system (e.g., Langfuse or Helicone). Provide CLI commands to view spending summaries per session, model and operation.
   - Estimate cost before executing a plan and prompt the user if the budget is insufficient.
   - Include latency and success rates in analytics to guide model selection.

7. **Unified type system**:
   - Remove duplicate type definitions by adopting a single `types.ts`. Ensure persisted records include all required fields (id, date, timestamp, reversible, model, cost, etc.) and that these types are imported consistently across modules.

8. **Testing & reliability**:
   - Add unit tests for all context bridge operations, model routing decisions (normal and edge cases), council deliberation logic and executor functions.
   - Create integration tests that simulate a full run (scout -> council -> executor) using mocked providers. Use Vitest as recommended.
   - Automate tests in CI (GitHub Actions) to catch regressions.

9. **Documentation update**:
   - The architecture documents should be rewritten to reflect the actual system and roadmap. Provide a clear separation between implemented features (foundation), near-term goals (Phase 1: real swarms) and long-term aspirations (adaptive planners, federated memory, analytics dashboards).
   - Include diagrams showing how swarms interact with the model router and memory layer, how the council surfaces disagreements and how tasks are decomposed.

## Proposed architecture for long-horizon tasks

The following architecture updates the existing design to support the user's requirement: "a system that can receive input from a user requiring coordination between multiple models over long-horizon goals."

### Layers and components

1. **User interface layer**
   - **CLI / API**: Accepts user requests; provides commands for executing tasks, viewing sessions, budgets and cost reports. In future, add a web dashboard.
   - **Strategic layer** (Janus orchestrator; model-agnostic): Provides human-level reasoning, helps the user formulate goals and evaluate results.

2. **Orchestrator**
   - Decomposes high-level goals into an execution plan with ordered phases and parallel tasks. Maintains a dependency graph and monitors progress.
   - Delegates tasks to appropriate swarms (scout, council, executor) and updates context with results and decisions. Ensures the Karpathy constraint by executing in small, explainable steps and seeking user confirmation at branch points.
   - Interfaces with the model router to estimate and track costs for each call, gating execution if budgets are exceeded. Emits cost events to the analytics layer.

3. **Swarm layer**
   - **Scout swarm**: Agents perform research, resource verification and data gathering using search APIs and package registries. Each agent returns structured findings with verification status and staleness indicators. Scouts run concurrently.
   - **Council swarm**: Multiple advisors (Claude, GPT, Gemini, etc.) deliberate on a specific question. Their structured proposals include confidence, uncertainties and alternatives. A disagreement detection module compares positions and highlights conflicts. A synthesizer attempts to reconcile or summarise, optionally asking the user for guidance when consensus is low.
   - **Executor swarm**: Executes code or tasks in phases. For example, code generation, environment setup, data ingestion and evaluation. Each executor writes artifacts to a controlled environment and returns logs. Failures or blocked tasks are reported to the orchestrator for re-planning.

4. **Memory layer**
   - **Context store**: Persists sessions, decisions, tasks and cost records. It is abstracted behind a storage interface with pluggable backends (local file, `claude-mem`, cloud KV). The memory layer also stores the manifesto and system configuration.
   - **Reasoning bank** (future): Stores reasoning patterns, best practices, and reusable modules for agents. Agents can consult it when solving new problems.

5. **Model router & provider layer**
   - Maintains metadata about available models (cost per token, latency, quality ratings). Integrates with `agentic-flow` or `liteLLM` to route calls. Supports dynamic model lists loaded from configuration or remote discovery.
   - Estimates token usage before calls and updates budgets after calls. Emits events to cost analytics.

6. **Analytics layer**
   - Collects cost entries, latency metrics and success rates. Exposes them through CLI (`janus costs`) and dashboards. Optionally integrates with external tools (Langfuse, Helicone) for detailed traces and cross-session analytics.

### Data flow for a long-horizon research task

1. **Input**: User provides a high-level goal, e.g., "Research the X market and find an underdeveloped niche. Then design a hierarchy of models to explore this niche."
2. **Planning**: Orchestrator (possibly aided by a high-level model) decomposes the task into stages:
   - Market research (scout swarm)
   - Niche identification and evaluation (scout + council)
   - Model hierarchy design (council + executor)
   - Implementation plan (executor)
3. **Execution**: For each stage, the orchestrator creates tasks with descriptions, dependencies and context. It delegates research tasks to scouts, then passes findings to the council. The council deliberates to select the most promising niches and designs the model hierarchy, surfacing disagreements for the user to decide. Finally, executors implement code prototypes or workflows.
4. **Result aggregation**: The orchestrator collects results, summarizes key decisions, records them in the context store and updates the current focus. It prompts the user for approvals when branching decisions are required.
5. **Feedback and iteration**: If the council cannot reach consensus or research results are insufficient, the orchestrator refines tasks and repeats. The user remains in control and can refine goals.

### Implementation plan

1. **Phase 1 - Foundation (2 weeks)**
   1. **Abstract memory**: Wrap context bridge behind an interface. Implement adapters for local file store and stub for `claude-mem`. Keep git sync as an optional plugin.
   2. **Enhance model router**: Load model configurations from JSON/YAML; support dynamic providers (Anthropic, OpenAI, others). Emit cost events to a central analytics service. Add CLI command to display current model table.
   3. **Unify types**: Remove duplicate type definitions; adopt a single `types.ts`. Ensure persisted records have all required fields and update read/write functions accordingly.
   4. **Testing**: Write unit tests for context bridge operations and model routing logic. Set up GitHub Actions for CI.

2. **Phase 2 - Swarm implementation (3 weeks)**
   1. **Real scout swarm**: Integrate research APIs and package registries. Implement staleness checks and resource verification as mandated by the manifesto. Use concurrency primitives (`Promise.all`) to run multiple scouts.
   2. **Council swarm**: Implement multi-advisor deliberation. Use the model router to call different models. Enforce the manifesto's structured response format. Detect disagreements by comparing proposals and highlight them. Provide synthesis logic or user prompts when consensus is low.
   3. **Executor swarm**: Design executor phases and implement a simple code runner. For tasks requiring code execution (e.g., generating a data-analysis script), run the code in a sandbox (e.g., Docker) and capture outputs. Start with stub executors and expand capabilities incrementally.
   4. **Orchestrator enhancements**: Replace the mocked `runStep` with real swarm calls. Implement dependency tracking and asynchronous monitoring. Provide progress reporting via CLI.
   5. **Cost persistence**: Update the model router to write cost entries to the context store after every call. Add CLI command (`janus costs`) to view cost summaries.

3. **Phase 3 - Memory & analytics (2 weeks)**
   1. **`claude-mem` integration**: Implement a memory adapter that reads/writes from the user's memory store. Provide functions to summarize long conversations and store them as sessions. Ensure privacy and user control over retention.
   2. **Analytics integration**: Choose an analytics provider (e.g., Langfuse or Helicone). Send cost and latency events. Build a `janus-dashboard` that displays budget usage, model performance and task success rates. Keep CLI summaries for local use.
   3. **Reasoning bank** (optional): Start a simple knowledge store where agents can record best practices and reuse previous reasoning patterns.

4. **Phase 4 - Adaptive planning & long-horizon support (ongoing)**
   1. **Dynamic task decomposition**: Use large models to generate execution plans given a high-level goal and available swarms. Evaluate plan quality using historical data and adjust heuristics.
   2. **Learning from feedback**: Record user feedback on council decisions and executor outputs. Use this to adjust confidence thresholds and model selection.
   3. **Scaling and reliability**: Add retry logic, fallback models and load balancing. Expand memory backends to support concurrent sessions and distributed workers.

## Deliverables to be approved

1. **Updated architecture document** (the section above can be turned into `ARCHITECTURE.md`). It should describe the layered architecture, components, data flow and normative rules. Remove outdated promises and clarify current capabilities vs. roadmap.
2. **Implementation plan**: A timeline broken into phases with clear milestones, as outlined above. Include acceptance criteria (e.g., scout swarm can verify real packages; council returns structured proposals; executor can run code in a sandbox; cost summaries visible via CLI).
3. **Refactored codebase** (not yet implemented) implementing Phase 1 changes: unified types, configurable model router, memory abstraction and initial tests. This should be prepared in a development branch and reviewed before merging.

Please review these recommendations and the proposed architecture. Once approved, work can proceed to implement Phase 1.
