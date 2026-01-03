# Janus Configuration - Foundation Implementation

**Status:** Locked configuration for the initial implementation phases

**Date:** December 18, 2025

**Configuration Version:** 1.1

This document captures configuration decisions approved by the user for the Janus project.  It supersedes the Week 1 plan and replaces references to the former strategic-layer model with the Janus orchestrator.

## 1. API Provider Strategy: Multi-cloud

- **Selected:** Anthropic, OpenAI, Google Gemini and OpenRouter
- **Rationale:** Flexibility and cost optimisation across providers[177272126167875 L143-L169]
- **Implementation:**
  - Use the model router to select the cheapest provider that meets the quality and latency requirements.
  - Primary: Anthropic Claude (quality)
  - Secondary: OpenAI and Gemini models (speed and balance)
  - Tertiary: OpenRouter (cost optimisation)
  - Automatic failover and cost-aware routing enabled
  - Model catalog lives in `janus-context/state/models.json` (provider order, quality tiers, pricing)
  - Add or adjust models by editing `models.json` (no code change required)
  - Learned tiers live in `janus-context/state/model-tiers.json`
  - Peer ratings append to `janus-context/state/model-ratings.jsonl`
  - Last-run pointer stored in `janus-context/state/last-model-run.json`
  - Peer ratings capture quality only; cost/latency are applied in the tier algorithm
- **Configuration keys:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`

## 2. Monthly budget

- **Selected:** \$100-\$150 per month
- **Capacity:** 1,000-2,000 tasks per month
- **Characteristics:** Balanced quality/cost trade-off for early development
- **Budget enforcement:** Hard limit at \$150; cost logged per operation and per session

## 3. Agent model assignment

- **Scout swarm:** Haiku (fast, inexpensive research)
- **Council swarm:** Sonnet (balanced deliberation)
- **Executor swarm:** Sonnet (balanced execution quality)
- **Strategic reasoning:** **Janus orchestrator** (top-level agent responsible for planning and delegation)
- **Rationale:** The orchestrator now performs strategic reasoning; no single external model controls the system.

## 4. Memory backend

- **Selected:** Local file store (Git-backed) for initial phase
- **Future:** Adapters for `claude-mem` and cloud KV stores[432503063334443 L138-L199]

## 5. Deployment target

- **Selected:** Local Docker deployment during early development
- **Characteristics:** Full control, zero infrastructure cost; can scale to cloud later

## 6. Observability and logging

- **Selected:** Detailed JSON logging for core operations, errors, performance metrics and cost entries
- **Output:** Console and log files in `logs/`
- **Cost impact:** Negligible

## 7. Testing strategy

- **Selected:** Unit and integration tests
- **Coverage:** Context bridge operations, session persistence, CLI commands, swarm calls, model router logic, cost tracking
- **Framework:** Vitest
- **CI:** GitHub Actions runs tests pre-commit

## 8. Cost optimisation

- **Selected:** Automatic smart routing and model selection
- **Features:**
  - Provider selection based on complexity, latency and budget
  - Per-operation cost estimation and monthly spend reports
  - Manual override available via CLI commands (`janus models`, `janus rate`)
- **Transparency:** All routing decisions are logged with reasoning

## 9. Repository structure

- **Context store:** `janus-context/` (independent Git repository)
- **Main repository:** `Janus/` (this code)
- **External dependencies:** Git submodules for `agentic-flow`, `llm-council`, `claude-os` and `claudelytics`
- **Rationale:** Independent versioning allows context store and dependencies to evolve separately

## 10. API key management

- **Method:** Environment variables via `.env`
- **Required keys:** `ANTHROPIC_API_KEY` (immediate), `OPENAI_API_KEY` and `OPENROUTER_API_KEY` (optional), `GITHUB_TOKEN` (for remote sync)
- **Security:** The `.env` file is `.gitignore`'d and never committed

## Implementation timeline

Janus development will proceed in phases that align with the architecture described in `ARCHITECTURE.md`:

- **Phase 1 - Foundation**
  - Abstract the context bridge behind a storage interface and unify type definitions.
  - Enhance the model router to load provider lists from configuration and emit cost events.
  - Implement unit tests for the context bridge and model router.

- **Phase 2 - Swarms**
  - Implement the scout swarm with real research APIs and verification protocols.
  - Build the council swarm based on the deliberation protocol, including disagreement detection and synthesis.
  - Develop the executor swarm with sandboxed code execution and artifact reporting.
  - Extend the CLI and orchestrator to support asynchronous tasks.

- **Phase 3 - Memory integration and analytics**
  - Add adapters for `claude-mem` and cloud stores.
  - Integrate with cost analytics providers (Langfuse, Helicone) and build a simple dashboard.
  - Implement summarisation functions to control context size.

- **Phase 4 - Adaptive planning**
  - Introduce dynamic task planners using large models and historical data.
  - Add feedback loops to adjust model selection and confidence thresholds.
  - Improve scalability through retries, fallbacks and load balancing.

## Success metrics

- **Foundation:** The context bridge passes >95% of CRUD tests; CLI commands operate without errors; unit tests achieve >90% coverage.
- **Budget compliance:** Spend stays within the monthly limit; cost information is visible in CLI outputs.
- **Quality:** No unhandled exceptions; decision reasoning and alternatives are captured for audit; performance metrics support optimisation.

## Notes

Configuration parameters are flexible and may be revisited after each phase.  Detailed logging will help identify optimisation opportunities, and the user can adjust budgets or provider preferences via environment variables.  Set `ENABLE_MODEL_PEER_RATINGS=false` to disable automatic peer ratings.
