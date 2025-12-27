<p align="center">
  <img src="janus-ascii-animated.gif" width="270" alt="Janus">
</p>

<h1 align="center">Janus</h1>

<p align="center">
  <strong>Long-Horizon Autonomous Task Execution via Multi-Model Orchestration</strong>
</p>

<p align="center">
  <img src="symposium-animated.gif" width="600" alt="The Symposium - AI et al.">
</p>

<p align="center">
  <a href="https://github.com/AI-et-al/Janus">
    <img src="https://img.shields.io/github/stars/AI-et-al/Janus?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/AI-et-al/Janus/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/AI-et-al">
    <img src="https://img.shields.io/badge/org-AI%20et%20al.-purple" alt="AI et al.">
  </a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> •
  <a href="#the-solution">The Solution</a> •
  <a href="#integrated-systems">Systems</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#frontier-models-december-2025">Models</a>
</p>

---

## The Problem

Today's AI assistants forget everything between sessions. You explain your codebase architecture, your preferences, your project history—and next conversation, it's gone. You're perpetually re-onboarding your AI collaborator.

Beyond memory, single-model systems create blind spots. One model's confident mistake becomes your confident mistake. And when things go wrong, the reasoning is opaque—you see outputs but not the decision process that produced them.

**Session Amnesia** • **Single-Model Bottleneck** • **Opacity**

## The Solution

**Janus** (named after the Roman god who looks both forward and backward) treats context as infrastructure, not ephemera. Every session builds on previous sessions. Decisions persist. Learnings accumulate.

When Claude and GPT disagree, that's not noise—it's the most valuable signal the system can provide. Janus surfaces disagreement rather than synthesizing false consensus.

Part of **[AI et al.](https://github.com/AI-et-al)** — a cooperative of humans and AI building meaningful tools together.

---

## Features

- **Multi-Cloud Routing**: Intelligent provider selection across Claude Opus 4.5, GPT-5.2, Gemini 3 based on task complexity and cost
- **Persistent Context**: Git-backed state management that maintains sessions, decisions, and tasks across executions
- **Observable Execution**: Every operation reports its cost, reasoning, and provider selection
- **Bounded Tasks**: Following the "Karpathy Constraint" - all work happens in human-reviewable chunks
- **Cost-Aware**: Automatic budget tracking with intelligent fallback to cheaper models
- **Council Deliberation**: Multi-model deliberation with peer review and synthesis

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/AI-et-al/Janus.git
cd Janus

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Build and run
npm run build
npm run janus info
```

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│ LAYER 1: STRATEGIC REASONING (Claude Opus 4.5)         │
│ Human-in-the-loop architectural decisions              │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ LAYER 2: COUNCIL DELIBERATION (Model Router)           │
│ Multi-model deliberation with peer review              │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ LAYER 3: EXECUTION (Orchestrator + Swarms)             │
│ Scout, Executor, and Reviewer agents                   │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ LAYER 4: PERSISTENCE (Context Bridge + Git)            │
│ Sessions, decisions, and state persisted to git        │
└────────────────────────────────────────────────────────┘
```

---

## Integrated Systems

| System | Purpose |
|--------|---------|
| **[claude-mem](./claude-mem)** | Persistent cross-session memory. Every observation, decision, and learning persists across sessions via SQLite + git sync. |
| **[claudelytics](./claudelytics)** | Usage analytics and cost tracking. Real-time dashboards showing token usage, costs, and model performance. |
| **[llm-council](./llm-council)** | Multi-model deliberation. Routes queries to Claude, GPT, and Gemini, synthesizes responses, surfaces disagreements. |
| **[agentic-flow](./agentic-flow)** | Workflow orchestration. Swarm coordination, parallel agent execution, and task decomposition. |
| **[janus-dashboard](./janus-dashboard)** | Real-time monitoring UI. Glassmorphism design with live system status and session tracking. |

## Core Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Context Bridge** | Git-backed persistent state management | Active |
| **Model Router** | Multi-cloud provider selection | Active |
| **Orchestrator** | Main execution engine | Active |
| **CLI Interface** | Command-line access | Active |
| **Swarms** | Parallel agent execution | Planned |

## Frontier Models (December 2025)

| Provider | Flagship | Fast |
|----------|----------|------|
| **Anthropic** | Claude Opus 4.5 | Claude Haiku 4.5 |
| **OpenAI** | GPT-5.2 Pro | GPT-5.2 Instant |
| **Google** | Gemini 3 | Gemini 3 Flash |

Janus automatically routes to the optimal model based on task complexity, cost constraints, and capability requirements.

---

## Design Principles

- **Disagreement Is Signal**: When models disagree, we surface it rather than synthesize false consensus
- **Show Your Work**: Every proposal includes confidence, uncertainties, and alternatives
- **Honor Constraints**: User specifications are inviolable
- **Incremental Over Heroic**: No thousand-line code drops—work in human-reviewable chunks

---

## Roadmap

- [x] Context Bridge (read, write, sync)
- [x] Model Router (multi-cloud routing)
- [x] Orchestrator (session + plan execution)
- [x] CLI (5 commands)
- [x] Scout Swarm (parallel research)
- [ ] Council Swarm (3-stage deliberation)
- [ ] Analytics integration

---

## Documentation

For complete technical documentation, see:
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Full API reference
- [MANIFESTO.md](./MANIFESTO.md) - Core principles
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CONFIGURATION.md](./CONFIGURATION.md) - Setup guide

---

## License

MIT — see the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  <strong>AI et al.</strong><br>
  <em>Humans and AI, building together</em>
</p>
