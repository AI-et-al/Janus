<p align="center">
  <img src="janus-color2.png" width="60%" alt="Janus" />
</p>

# Janus: Multi-Model Orchestration Platform

<p align="center">
  <img src="https://janus-assets.us-lax-1.linodeobjects.com/symposium-animated-optimized.gif" width="100%" alt="Janus ASCII" />
</p>

Janus is a research and engineering platform for coordinating multiple large-language models (LLMs) and tool-using agents over long-horizon tasks.  It combines a **context bridge** for persistent state, a **model router** for cost-aware provider selection, and a layered **swarm architecture** designed to decompose complex goals into observable, verifiable steps.  The system's name evokes the Roman deity Janus, whose two faces look both backward and forward: Janus remembers past sessions via persistent memory while planning and executing future actions.

## Motivation

Modern language models excel at individual tasks but struggle to **coordinate** on open-ended goals that require research, deliberation, execution and learning over time.  Most chat interfaces treat interactions as transient, leaving no durable record and no mechanism for reusing insights across sessions.  Janus addresses these limitations by:

* Providing a **persistent context store** so sessions, decisions and delegated tasks survive across runs and can be revisited or resumed later.
* Routing calls across **multiple model providers** (Anthropic, OpenAI and others) based on task complexity, budget and quality requirements[177272126167875 L143-L169].
* Encouraging **explicit disagreement** and transparent reasoning among collaborating models, as codified in the project's [Manifesto](MANIFESTO.md).
* Enforcing the **Karpathy constraint**: every step must be small, bounded and observable, with cost estimates surfaced before execution[976079008273562 L184-L257].

These principles allow Janus to tackle long-horizon goals such as "research the renewable energy market, identify under-served niches, and design a hierarchy of agents to explore them" while giving the human operator full control over plans, costs and decisions.

## Architectural overview

Janus follows a **layered architecture** to separate concerns and support extensibility:

1. **User interface layer** - A command-line interface (CLI) accepts tasks from the user, lists sessions, shows the current focus and displays budget status.  A future web dashboard will provide richer interaction.
2. **Orchestrator** - The Janus orchestrator decomposes high-level goals into a plan consisting of research (scout), deliberation (council) and execution (executor) phases.  It tracks dependencies, delegates sub-tasks to swarms and updates the context store with results.  The orchestrator is itself an agent, responsible for top-level reasoning; it does not rely on any single provider for strategic control.
3. **Swarm layer** - Specialised swarms perform domain-specific work:
   * **Scout swarm** conducts research and verification against external resources (e.g., web search, package registries).  Agents must verify URLs, packages and documentation before citing them, abiding by the manifesto's "Draconian Scout Protocol."
   * **Council swarm** consists of multiple advisor models (Claude, GPT, Gemini, etc.) that deliberate on questions.  Each advisor presents a proposal with confidence, uncertainties and alternatives; disagreements are surfaced, not hidden.  A synthesis step produces a consensus or highlights issues requiring human input.
   * **Executor swarm** performs code generation and execution in bounded phases, producing artifacts and logs.  Executors operate in sand-boxed environments and report success or failure with cost and latency.
4. **Memory layer** - A pluggable context store persists sessions, decisions, tasks and cost records.  The current implementation uses a Git-backed file store, but adapters for **claude-mem** and cloud key-value stores are planned.  The memory layer ensures cross-session continuity and enables auditing of past actions[432503063334443 L138-L199].
5. **Model router** - An intelligent router selects the optimal model for each call based on available providers, cost per token and quality requirements.  It tracks budget usage, records cost entries and can persist session cost summaries for analytics[177272126167875 L143-L169].  Learned tier snapshots (fast/balanced/quality) can be applied from `janus-context/state/` as peer ratings accumulate.
6. **Analytics layer** - Cost entries, latencies and success rates can be exported to analytics tools such as Langfuse or Helicone.  A future `janus-dashboard` will visualize budget usage and model performance.

The layered design allows each component to evolve independently while collaborating through well-defined interfaces.

## Current status

Janus is under active development.  The foundations include:

* **Context bridge** - A file-backed persistence layer that stores sessions, decisions and delegated tasks under `janus-context/`.  It can be synchronised via Git to share state across machines.
* **Model router** - Routing logic for Anthropic, OpenAI and Gemini models with budget tracking and cost recording.  It selects models based on cost and quality constraints, with optional learned tier overrides from peer ratings[177272126167875 L33-L64].  Add or adjust entries in `janus-context/state/models.json` to include additional models.
* **CLI** - Basic commands to execute tasks, list sessions, view the current focus and check the context history.

Upcoming milestones include:

* Implementing **real swarms** (scout, council, executor) with concurrency and error handling.
* Integrating **claude-mem** for cross-instance memory and building a reasoning bank for reusable knowledge.
* Adding **cost analytics and dashboards** for detailed spending breakdowns.
* Developing **adaptive planners** that use large models to decompose high-level goals into sub-tasks.
* Expanding the **model router** to support dynamic model lists and new providers.

For a detailed roadmap and progress tracker, see `CONFIGURATION.md`.

## Getting started

1. **Clone the repository** and install dependencies:

   ```bash
   git clone https://github.com/AI-et-al/Janus.git
   cd Janus
   npm install
   ```

2. **Configure environment variables** by copying `.env.example` to `.env` and populating API keys for Anthropic, OpenAI, Gemini and other providers.  Set `JANUS_CONTEXT_PATH` to point to your context directory (default: `./janus-context`).

3. **Run the CLI** to verify operation:

   ```bash
   npx tsx src/cli.ts hello         # verify communication
   npx tsx src/cli.ts execute "Find three emerging EV battery technologies"
   npx tsx src/cli.ts sessions      # list recorded sessions
   npx tsx src/cli.ts focus         # show current focus
   npx tsx src/cli.ts models        # show model tiers (base vs learned)
   npx tsx src/cli.ts rate 4 "solid output for the cost"
   ```

4. **Explore the context** by navigating into `janus-context/` and inspecting sessions or decisions.  The context is Git-backed; commit and push it if you wish to share state across machines.

## Contributing

We welcome contributions from researchers and engineers interested in multi-agent systems, model routing and AI orchestration.  Before submitting changes, please:

1. Read the [Manifesto](MANIFESTO.md) to understand the normative rules (e.g., explicit disagreements, cost consciousness and the human's primacy).
2. Follow the environment and workflow guidelines in [AGENTS.md](AGENTS.md).  These instructions apply to both human developers and AI agents.
3. Keep commits small and conform to Conventional Commit messages (`feat`, `fix`, `docs`, etc.).  Ensure unit tests and type checks pass (see `CONFIGURATION.md` for the testing strategy).  Do not introduce new dependencies without a quick health check.
4. When adding or modifying swarms, ensure that prompts enforce the manifesto and that agents report token usage and cost.  Surface disagreements rather than hiding them.

## License

Janus is released under the MIT License.  See `LICENSE` for details.
