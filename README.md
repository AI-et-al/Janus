<p align="center">
  <img src="janus-ascii-animated.gif" width="270" alt="Janus">
</p>

<h1 align="center">Janus</h1>

<p align="center">
  <strong>Multi-Model AI Orchestration System</strong>
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
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#components">Components</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## About

**Janus** (named after the Roman god with two faces) coordinates multiple AI models working in parallel. When Claude and GPT disagree, that's not noise—it's the most valuable signal the system can provide.

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

## Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **Context Bridge** | Git-backed persistent state management | Active |
| **Model Router** | Multi-cloud provider selection | Active |
| **Orchestrator** | Main execution engine | Active |
| **CLI Interface** | Command-line access | Active |
| **Swarms** | Parallel agent execution | Planned |

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
- [ ] Scout Swarm (parallel research)
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
