<p align="center">
  <img src="janus-color2.png" width="100%" alt="Janus">
</p>

<h1 align="center">Janus</h1>

<p align="center">
  <strong>Multi-Model AI Orchestration with Persistent Cross-Session Memory</strong>
</p>

<p align="center">
  <img src="symposium-animated.gif" width="800" alt="The Symposium - AI et al.">
</p>
<p align="center">
  <a href="https://github.com/AI-et-al/Janus">
    <img src="https://img.shields.io/github/stars/AI-et-al/Janus-?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/AI-et-al/Janus-/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/AI-et-al">
    <img src="https://img.shields.io/badge/org-AI%20et%20al.-purple" alt="AI et al.">
  </a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#components">Components</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## The Problem

Contemporary LLM agents suffer from a fundamental limitation: **context amnesia**.

Each session starts from zero. The insights discovered at 2 AM vanish by morning. The architectural decisions debated across three conversations exist only in scattered chat logs. The bug you fixed last week? The agent doesn't remember fixing it. The library you decided against using? It'll suggest it again tomorrow. The institutional knowledge that makes human teams effective—the accumulated understanding of "how we do things here"—simply doesn't transfer.

This isn't a minor inconvenience. It's a structural barrier to genuine AI-augmented software engineering.

Consider what happens when you ask an AI assistant to help with a complex codebase:

1. **Session 1**: You explain the architecture. The agent understands. You make progress.
2. **Session 2**: New context window. You explain the architecture again. From scratch.
3. **Session 3**: You've now spent more time re-explaining than building.

The cognitive overhead of context reconstruction dominates actual productive work. And it gets worse: the agent can't learn from its mistakes. Every session, it has the same blind spots, makes the same suggestions you've already rejected, proposes the same patterns that don't fit your codebase.

**Janus exists to solve this.**

Named after the Roman god who simultaneously perceives past and future, Janus orchestrates multiple AI models while maintaining persistent memory across sessions, instances, and contexts. It looks backward—learning from every interaction, preserving decisions and their rationales—while looking forward—routing each task to the optimal model based on capability, cost, and current context.

---

## What Janus Actually Does

### 1. Persistent Cross-Session Memory

Every significant observation, decision, and insight is captured, indexed, and retrievable:

```
Session 47 (3 weeks ago):
  Decision: Use WebSockets over SSE for real-time updates
  Rationale: Need bidirectional communication for collaborative editing
  Alternatives considered: SSE (simpler but unidirectional), polling (too slow)
  Made by: Council (Claude + GPT-5.2 + Gemini agreed)

Session 52 (2 weeks ago):
  Bug: WebSocket reconnection failing silently after network interruption
  Fix: Added exponential backoff with jitter, max 5 retries
  Files: src/realtime/socket-manager.ts:142-198

Session 58 (yesterday):
  Insight: The socket-manager reconnection logic could be extracted
  into a generic retry utility for API calls too
```

When you start Session 59, this context is available. The agent knows what you decided, why you decided it, what broke, and what ideas are floating around. No re-explanation required.

### 2. Multi-Model Orchestration

Different models excel at different tasks. GPT-5.2 writes better documentation. Claude Opus 4.5 handles complex reasoning. Gemini 3 Flash is fast and cheap for iteration. Janus routes intelligently:

| Task Type | Routed To | Why |
|-----------|-----------|-----|
| Quick iteration, syntax fixes | Gemini 3 Flash | Fast, cheap, good enough |
| Code review, architecture | Claude Opus 4.5 | Deep reasoning, catches subtle issues |
| Documentation, explanation | GPT-5.2 | Clear prose, good structure |
| Strategic decisions | LLM Council | Multiple perspectives, surfaced disagreement |

### 3. Observable Disagreement

When you ask three frontier models the same architectural question, they often disagree. Most systems hide this—they pick one answer or try to synthesize a false consensus.

Janus surfaces disagreement explicitly:

```
Query: Should we use a monorepo or polyrepo for the microservices?

Claude Opus 4.5: Monorepo. Atomic commits across services, unified
  CI/CD, easier refactoring. The tooling has matured (Nx, Turborepo).

GPT-5.2: Polyrepo. Independent deployment cycles, clearer ownership
  boundaries, simpler CI per service. Monorepo tooling adds complexity.

Gemini 3: Depends on team size. <10 engineers → monorepo. >30 → polyrepo.
  You're at 15, so either works. I'd lean monorepo for now, migrate later
  if needed.

Chairman synthesis: No consensus. Key factor is team size and deployment
  independence requirements. Recommend documenting current constraints
  and revisiting in 6 months.
```

This is more useful than a confident-sounding wrong answer.

### 4. Swarm Coordination

For tasks requiring parallel work—researching multiple approaches, validating across different contexts, exploring a codebase—Janus coordinates agent swarms:

- **Scout Swarm**: Parallel research agents that fan out, gather information, and synthesize
- **Executor Swarm**: Coordinated code modifications across multiple files
- **Council Swarm**: Multi-model deliberation for strategic decisions

---

## Design Philosophy

### The Karpathy Constraint

Named after Andrej Karpathy's observation that most AI tooling doesn't provide leverage beyond basic prompting, this constraint requires every Janus feature to demonstrably amplify what's possible.

**Passes the constraint:**
- Memory that surfaces relevant past decisions without being asked
- Routing that genuinely picks better models for specific tasks
- Council deliberation that reveals disagreement you wouldn't have found

**Fails the constraint:**
- Chat UI wrappers around API calls
- "Agent frameworks" that just add boilerplate
- Token counters that don't inform decisions

If you can accomplish the same thing with a well-crafted prompt and a direct API call, Janus shouldn't be doing it.

### Observable Disagreement

Consensus-seeking algorithms that paper over genuine uncertainty are epistemically dishonest. When frontier models disagree on non-trivial problems—and they do, frequently—that disagreement contains information.

Janus treats disagreement as signal, not noise:
- Disagreements are logged with full reasoning from each model
- The chairman model synthesizes but doesn't suppress minority opinions
- Users can query historical disagreements to understand evolving consensus

### Memory as Infrastructure

Cross-session memory isn't a feature bolted on at the end. It's foundational infrastructure that shapes every other design decision.

This means:
- Memory operations are first-class, not afterthoughts
- The schema supports rich queries (by date, by file, by concept, by decision type)
- Memory is append-only with full history—nothing is silently forgotten
- External tools can read memory state (it's just SQLite)

### Frontier Models Only

Janus exclusively uses current-generation frontier models. The capability gap between model generations is too significant to compromise on for cost savings.

**Current Frontier (December 2025):**

| Provider | Flagship | Fast | Deprecated (DO NOT USE) |
|----------|----------|------|------------------------|
| Anthropic | Claude Opus 4.5 | Claude Haiku 4.5 | Claude 3.x series |
| OpenAI | GPT-5.2 Pro | GPT-5.2 Instant | GPT-4, GPT-4o |
| Google | Gemini 3 Pro | Gemini 3 Flash | Gemini 1.5, 2.x |

Model references are updated at the start of each session. If you see code referencing `claude-3-sonnet` or `gpt-4o`, it's stale and should be updated.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            JANUS ORCHESTRATOR                                │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     MEMORY LAYER (claude-mem)                          │ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ Observation │  │   Session   │  │   Search    │  │  Timeline   │  │ │
│  │  │   Store     │  │   Manager   │  │   Index     │  │  Navigator  │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │                           │                                           │ │
│  │                    ┌──────┴──────┐                                   │ │
│  │                    │   SQLite    │                                   │ │
│  │                    │  Database   │                                   │ │
│  │                    └─────────────┘                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │    LLM Council      │  │    Model Router     │  │  janus-dashboard   │  │
│  │                     │  │                     │  │                    │  │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌──────────────┐ │  │
│  │  │ Claude Opus   │  │  │  │ Cost Tracker  │  │  │  │ Agent Status │ │  │
│  │  │ GPT-5.2       │  │  │  │ Capability    │  │  │  │ Memory View  │ │  │
│  │  │ Gemini 3      │  │  │  │ Matcher       │  │  │  │ SSE Stream   │ │  │
│  │  │ GLM 4.7       │  │  │  │ Fallback      │  │  │  │ Cmd Palette  │ │  │
│  │  └───────────────┘  │  │  │ Chains        │  │  │  └──────────────┘ │  │
│  │         │          │  │  └───────────────┘  │  │         │          │  │
│  │  ┌──────┴──────┐   │  │         │          │  │  ┌──────┴──────┐   │  │
│  │  │  Chairman   │   │  │  ┌──────┴──────┐   │  │  │ Glassmorphic│   │  │
│  │  │  (Gemini 3  │   │  │  │  LiteLLM    │   │  │  │     UI      │   │  │
│  │  │    Pro)     │   │  │  │   Proxy     │   │  │  └─────────────┘   │  │
│  │  └─────────────┘   │  │  └─────────────┘   │  │                    │  │
│  └─────────────────────┘  └─────────────────────┘  └────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         ROUTING LAYER                                  │ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ OpenRouter  │  │  LiteLLM    │  │ Oh My       │  │  Direct     │  │ │
│  │  │ (primary)   │  │  (local)    │  │ OpenCode    │  │  API calls  │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          SWARM LAYER                                   │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │ │
│  │  │   Scout Swarm    │  │  Executor Swarm  │  │  Council Swarm   │    │ │
│  │  │                  │  │                  │  │                  │    │ │
│  │  │ • Parallel       │  │ • Coordinated    │  │ • Multi-model    │    │ │
│  │  │   research       │  │   code changes   │  │   deliberation   │    │ │
│  │  │ • URL verify     │  │ • File sync      │  │ • Disagreement   │    │ │
│  │  │ • Doc search     │  │ • Test runner    │  │   preservation   │    │ │
│  │  │ • Package check  │  │ • Build verify   │  │ • Chairman       │    │ │
│  │  │                  │  │                  │  │   synthesis      │    │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘    │ │
│  │                                                                        │ │
│  │  Transport: QUIC (agentic-flow) / HTTP fallback                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       ANALYTICS LAYER                                  │ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │ claudelytics│  │   Token     │  │    Cost     │  │  Pattern    │  │ │
│  │  │   (core)    │  │  Counter    │  │  Optimizer  │  │  Detector   │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User query arrives** → Orchestrator receives request
2. **Memory consulted** → Relevant past observations, decisions, context loaded
3. **Route determined** → Model selected based on task type, cost constraints, capability match
4. **Execution** → Single model call OR council deliberation OR swarm deployment
5. **Response generated** → Answer synthesized, disagreements preserved if applicable
6. **Memory updated** → Significant observations, decisions, insights captured
7. **Analytics logged** → Tokens, cost, timing, patterns recorded

---

## Components

### claude-mem — Persistent Cross-Session Memory

The memory substrate that makes everything else possible.

**What it stores:**
- **Observations**: Discoveries, bug findings, code insights, file contents examined
- **Decisions**: Choices made, rationale, alternatives considered, who made them
- **Sessions**: Start/end times, summaries, key decisions per session, open questions
- **Prompts**: Full prompt history for context reconstruction

**Storage:**
- SQLite database (portable, queryable, backupable)
- Full-text search index for natural language queries
- Timeline index for chronological navigation
- Semantic retrieval via embedding similarity (optional, with ChromaDB)

**Access patterns:**
```typescript
// Search by keyword
search({ query: "authentication bug", limit: 20 })

// Get timeline around a specific observation
timeline({ anchor: 11131, depth_before: 5, depth_after: 5 })

// Filter by type and date
search({
  type: "observations",
  obs_type: "decision",
  dateStart: "2025-12-01",
  limit: 50
})

// Batch fetch by IDs
get_batch_observations({ ids: [11131, 10942, 10855] })
```

**MCP Integration:**

claude-mem exposes tools via Model Context Protocol, making memory available to any MCP-compatible client:

```
mcp__plugin_claude-mem_claude-mem-search__search
mcp__plugin_claude-mem_claude-mem-search__timeline
mcp__plugin_claude-mem_claude-mem-search__get_observation
mcp__plugin_claude-mem_claude-mem-search__get_batch_observations
mcp__plugin_claude-mem_claude-mem-search__get_session
mcp__plugin_claude-mem_claude-mem-search__get_prompt
```

**Status:** ✓ Production — Currently providing memory for active Claude Code sessions

**Location:** `claude-mem/`

---

### llm-council-agent — Multi-Model Deliberation

When a decision matters, don't ask one model—convene a council.

**How it works:**

1. **Query submitted** to council with system context
2. **Each model responds** independently (Claude, GPT-5.2, Gemini, GLM)
3. **Chairman reviews** all responses, identifies agreements and disagreements
4. **Synthesis produced** preserving minority opinions and uncertainty
5. **Result stored** in memory with full deliberation trace

**Council composition (default):**
- Claude Opus 4.5 — Deep reasoning, nuanced analysis
- GPT-5.2 — Broad knowledge, clear explanations
- Gemini 3 Pro — Fast synthesis, practical recommendations
- GLM 4.7 — Alternative perspective, strong on code

**Chairman:** Gemini 3 Pro (configurable)

**Usage:**
```bash
cd llm-council-agent-ts
npm install
npm run dev "Should we implement rate limiting at the API gateway or per-service?"
```

**Output example:**
```
╔══════════════════════════════════════════════════════════════════╗
║                        COUNCIL DELIBERATION                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Query: Rate limiting location                                     ║
║ Duration: 4.2s | Cost: $0.0163 | Models: 4                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ CLAUDE OPUS 4.5:                                                  ║
║ API gateway for global limits, per-service for business logic.   ║
║ Defense in depth. Gateway catches abuse, services enforce        ║
║ domain-specific quotas.                                          ║
║                                                                   ║
║ GPT-5.2:                                                          ║
║ Start with gateway only. Add per-service when you have evidence  ║
║ you need it. YAGNI. Distributed rate limiting is operationally   ║
║ complex (Redis cluster, race conditions).                        ║
║                                                                   ║
║ GEMINI 3:                                                         ║
║ Gateway. 90% of rate limiting needs are "don't DDoS me" which    ║
║ the gateway handles. Per-service adds latency on every request.  ║
║                                                                   ║
║ GLM 4.7:                                                          ║
║ Both, but gateway is the priority. Use token bucket at gateway,  ║
║ sliding window per-service only for premium tier features.       ║
║                                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ CHAIRMAN SYNTHESIS:                                               ║
║                                                                   ║
║ Consensus: API gateway rate limiting is the clear priority.      ║
║ Disagreement: Whether per-service limiting is needed now or      ║
║ should wait for evidence.                                        ║
║                                                                   ║
║ Recommendation: Implement gateway rate limiting immediately.     ║
║ Defer per-service until you have specific business requirements  ║
║ that gateway limits can't address.                               ║
╚══════════════════════════════════════════════════════════════════╝
```

**Configuration:**

Environment variables in `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
COUNCIL_MODELS=openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro,zhipu/glm-4.7
CHAIRMAN_MODEL=google/gemini-3-pro
```

**Status:** ✓ Operational — Tested with OpenRouter, ~$0.016 per query

**Location:** `llm-council-agent-ts/` (TypeScript), `llm-council-agent-py/` (Python)

---

### janus-dashboard — Real-Time Agent Observatory

Glassmorphism UI for monitoring agent state, memory, and system health.

**Features:**
- **Agent Status Panel**: Live indicators for all active Claude instances
- **Memory Browser**: Search and navigate observations, sessions, prompts
- **Session Timeline**: Chronological view of work across sessions
- **Command Palette**: Quick actions via Cmd+K / Ctrl+K
- **SSE Stream**: Real-time updates without polling
- **Cost Tracker**: Running totals by model and session

**Tech stack:**
- Vanilla HTML/CSS/JS (no build step, just open index.html)
- Glassmorphism design language matching Janus visual identity
- SSE connection to claude-mem worker for live updates

**Usage:**
```bash
# One-liner start
./start-dashboard.sh

# Or manually
cd janus-dashboard
python -m http.server 8080
# Open http://localhost:8080
```

**Keyboard shortcuts:**
| Key | Action |
|-----|--------|
| `Cmd+K` | Open command palette |
| `Cmd+R` | Refresh all panels |
| `Cmd+F` | Focus search |
| `Escape` | Close modals |

**Status:** ✓ Active

**Location:** `janus-dashboard/`

---

### Oh My OpenCode Integration

Janus integrates with [Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode), the "battery-included" Claude Code harness developed by @code-yeongyu.

**What Oh My OpenCode provides:**

1. **Specialized Sub-Agents**
   - **Sisyphus** (Opus 4.5 High): Primary agent for complex tasks
   - **Oracle**: Debugging specialist
   - **Frontend Engineer**: UI/UX focused agent
   - **Librarian**: Documentation and codebase navigation
   - **Explore**: Quick codebase search and understanding

2. **Developer Tools Integration**
   - LSP integration for intelligent code actions
   - AST-Grep for structural code search and refactoring
   - Automatic formatting and linting
   - Token-optimized multimodal support

3. **Quality Enforcement**
   - Comment quality checking
   - Todo Continuation Enforcer (prevents incomplete work)
   - Pre/Post tool use hooks for validation

4. **Curated MCP Servers**
   - Exa (search)
   - Context7 (documentation)
   - Grep.app (code search)

**Integration status:** The memory sharing problem between Janus and Oh My OpenCode sub-agents remains unsolved (see [Memory Challenge](#the-memory-challenge)).

**Status:** ✓ Integrated as of December 2025

---

### agentic-flow — QUIC-Based Swarm Coordination

Third-party package from @ruvnet providing distributed agent coordination.

**Claimed capabilities:**
- QUIC transport layer for low-latency agent-to-agent communication
- Topology support: mesh, hierarchical, ring, star
- Connection pooling and heartbeat management
- State synchronization across agents
- Binary message serialization

**What the code shows:**
- `QuicCoordinator` class with topology-aware routing
- Agent registration and capability tracking
- Message queue with TTL support
- Statistics tracking (latency, throughput, active connections)

**What's unverified:**
- Has the QUIC transport been tested end-to-end on this machine?
- Do the example scripts (`quic-swarm-mesh.ts`, etc.) actually run?
- What dependencies are required for QUIC (native bindings)?

**Verification steps:**
```bash
cd agentic-flow
npm install
npm run build
npm test

# Try an example
cd agentic-flow  # nested directory, package structure
npx tsx examples/quic-swarm-mesh.ts
```

**Status:** ⚠️ Code present, local verification pending

**Location:** `agentic-flow/`

---

### claudelytics — Usage Analytics

Token consumption, cost tracking, and usage pattern analysis.

**Tracks:**
- Tokens per session, per model, per task type
- Cost breakdown by provider
- Cache hit rates (prompt caching efficiency)
- Response latencies
- Error rates and retry counts

**Status:** ✓ Active

**Location:** `claudelytics/`

---

### Model Router (LiteLLM)

Unified interface for multi-provider model access with cost optimization.

**Configuration tiers:**

| Tier | Purpose | Models |
|------|---------|--------|
| A (Fast/Cheap) | Dev iteration | Gemini 3 Flash, Haiku 4.5, GPT-5.2 Instant |
| B (Mid-tier) | Quality checks | Gemini 3 Pro, Sonnet 4.5, GPT-5.2 |
| C (Flagship) | Production/gold | Opus 4.5, GPT-5.2 Pro |
| Council | Deliberation | All Tier B models + GLM 4.7 |
| Auto | Fallback chain | Gemini → Claude → GPT (in order) |

**Configuration file:** `litellm_config.yaml`

**Starting the proxy:**
```bash
litellm --config litellm_config.yaml --port 4000

# Verify
curl http://localhost:4000/health
```

**Status:** ⚠️ Configuration present, proxy deployment optional

---

## Installation

### Prerequisites

- **Node.js 18+** (20+ recommended)
- **Python 3.10+** (for LiteLLM proxy, optional)
- **Claude Code** with MCP support
- **API keys** for desired providers

### Quick Start

```bash
# Clone
git clone https://github.com/AI-et-al/Janus-.git
cd Janus-

# Install claude-mem (if not already a Claude Code plugin)
cd claude-mem
npm install
npm run build

# Install LLM Council
cd ../llm-council-agent-ts
npm install

# Start dashboard
cd ..
./start-dashboard.sh
```

### Full Installation

#### 1. claude-mem Setup

If installing as a Claude Code plugin:
```bash
# claude-mem is typically installed via plugin manager
# Check your Claude Code settings for plugin installation
```

If running standalone:
```bash
cd claude-mem
npm install
npm run build
npm run start  # Starts the worker process
```

#### 2. LLM Council Setup

```bash
cd llm-council-agent-ts
npm install

# Create .env file
cat > .env << 'EOF'
OPENROUTER_API_KEY=sk-or-v1-your-key-here
COUNCIL_MODELS=openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro,zhipu/glm-4.7
CHAIRMAN_MODEL=google/gemini-3-pro
EOF

# Test
npm run dev "Hello, council"
```

#### 3. LiteLLM Proxy (Optional)

```bash
# Install LiteLLM
pip install litellm

# Set API keys
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
export OPENROUTER_API_KEY=sk-or-v1-...

# Start proxy
litellm --config litellm_config.yaml --port 4000
```

#### 4. Dashboard

```bash
# Option A: Shell script
./start-dashboard.sh

# Option B: PowerShell (Windows)
.\start-dashboard.ps1

# Option C: Manual
cd janus-dashboard
python -m http.server 8080
```

#### 5. agentic-flow (Optional, Experimental)

```bash
cd agentic-flow
npm install
npm run build

# Run tests to verify functionality
npm test

# Try examples
npx tsx agentic-flow/examples/quic-swarm-mesh.ts
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ══════════════════════════════════════════════════════════════════
# REQUIRED: At least one provider API key
# ══════════════════════════════════════════════════════════════════

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI (for GPT models)
OPENAI_API_KEY=sk-...

# Google (for Gemini models)
GEMINI_API_KEY=AI...

# OpenRouter (unified access to multiple providers - RECOMMENDED)
OPENROUTER_API_KEY=sk-or-v1-...

# Z.ai (for GLM models, optional)
ZAI_API_KEY=...

# ══════════════════════════════════════════════════════════════════
# OPTIONAL: LiteLLM proxy configuration
# ══════════════════════════════════════════════════════════════════

LITELLM_MASTER_KEY=your-admin-key
LITELLM_PORT=4000

# ══════════════════════════════════════════════════════════════════
# OPTIONAL: Council configuration
# ══════════════════════════════════════════════════════════════════

COUNCIL_MODELS=openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro
CHAIRMAN_MODEL=google/gemini-3-pro

# ══════════════════════════════════════════════════════════════════
# OPTIONAL: Cost controls
# ══════════════════════════════════════════════════════════════════

JANUS_MONTHLY_BUDGET=100.00
JANUS_ENABLE_COST_OPTIMIZATION=true
```

### LiteLLM Configuration

The `litellm_config.yaml` file defines available models and routing:

```yaml
model_list:
  # Tier A: Fast/Cheap
  - model_name: flash
    litellm_params:
      model: gemini/gemini-3-flash
      api_key: os.environ/GEMINI_API_KEY

  - model_name: haiku
    litellm_params:
      model: anthropic/claude-haiku-4-5-20251201
      api_key: os.environ/ANTHROPIC_API_KEY

  # Tier B: Mid-tier
  - model_name: sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20251201
      api_key: os.environ/ANTHROPIC_API_KEY

  # Tier C: Flagship
  - model_name: opus
    litellm_params:
      model: anthropic/claude-opus-4-5-20251101
      api_key: os.environ/ANTHROPIC_API_KEY

  # Council models
  - model_name: council/claude
    litellm_params:
      model: anthropic/claude-sonnet-4-5-20251201
      api_key: os.environ/ANTHROPIC_API_KEY

litellm_settings:
  max_budget: 50.0  # Daily budget in USD
  cache: true
  request_timeout: 120
```

See `litellm_config.yaml` for the complete configuration.

### Memory Configuration

claude-mem configuration is managed through its plugin settings. Key options:

| Setting | Default | Description |
|---------|---------|-------------|
| `autoCapture` | `true` | Automatically capture observations |
| `captureTypes` | `all` | Types to capture: decision, discovery, bugfix, feature, change |
| `summaryModel` | `haiku` | Model for generating summaries |
| `maxContextTokens` | `8000` | Max tokens for context injection |

---

## Usage

### Memory Search

From Claude Code with claude-mem installed:

```
Use the mem-search skill to find past work:

> Search for "authentication" in memory
> What decisions did we make about the database schema?
> Show me the timeline around observation #11131
```

Programmatic access:
```typescript
// Search
const results = await mcp.search({
  query: "rate limiting",
  limit: 20,
  project: "my-project"
});

// Timeline
const context = await mcp.timeline({
  anchor: 11131,
  depth_before: 5,
  depth_after: 5
});

// Batch fetch
const observations = await mcp.get_batch_observations({
  ids: [11131, 10942, 10855]
});
```

### LLM Council

Interactive query:
```bash
cd llm-council-agent-ts
npm run dev "What's the best way to handle database migrations in a microservices architecture?"
```

Programmatic:
```typescript
import { runCouncil } from './council';

const result = await runCouncil({
  query: "Should we use GraphQL or REST for this API?",
  models: ['claude-opus-4-5', 'gpt-5.2', 'gemini-3-pro'],
  chairman: 'gemini-3-pro'
});

console.log(result.synthesis);
console.log(result.disagreements);
```

### Dashboard

1. Start the dashboard: `./start-dashboard.sh`
2. Open http://localhost:8080
3. Use Cmd+K for command palette
4. Browse memory, sessions, and agent status

### Model Routing

With LiteLLM proxy running:
```bash
# Quick task (routes to Tier A)
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "flash", "messages": [{"role": "user", "content": "Fix this typo"}]}'

# Important task (routes to Tier C)
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "opus", "messages": [{"role": "user", "content": "Review this architecture"}]}'

# Auto-failover
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## API Reference

### claude-mem MCP Tools

#### `search`

Search observations, sessions, or prompts.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Max results (default: 20) |
| `project` | string | Yes | Project name |
| `type` | string | No | "observations", "sessions", or "prompts" |
| `obs_type` | string | No | Filter: "bugfix", "feature", "decision", "discovery", "change" |
| `dateStart` | string | No | Start date (YYYY-MM-DD) |
| `dateEnd` | string | No | End date (YYYY-MM-DD) |

**Returns:** Table of matching items with IDs, timestamps, titles, token counts.

#### `timeline`

Get chronological context around an anchor point.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `anchor` | number | Yes* | Observation ID to center on |
| `query` | string | Yes* | Alternative: find anchor by search |
| `depth_before` | number | No | Items before anchor (default: 10) |
| `depth_after` | number | No | Items after anchor (default: 10) |
| `project` | string | No | Project filter |

*One of `anchor` or `query` required.

**Returns:** Chronological list of observations, sessions, and prompts around the anchor.

#### `get_observation`

Fetch full details of a single observation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | number | Yes | Observation ID |

**Returns:** Complete observation with content, metadata, related files.

#### `get_batch_observations`

Fetch multiple observations efficiently.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ids` | number[] | Yes | Array of observation IDs |
| `orderBy` | string | No | "date_desc" or "date_asc" |
| `limit` | number | No | Max to return |

**Returns:** Array of complete observations.

#### `get_session`

Fetch session details.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | number | Yes | Session ID |

**Returns:** Session with summary, duration, key decisions, observations.

---

## The Memory Challenge

### The Cross-Instance Problem

Here's an unsolved problem we're actively working on: **memory doesn't transfer between Claude instances.**

When you run Claude Code in one terminal with claude-mem, that instance accumulates observations and builds context. But:

- Spawn another Claude Code instance in a different terminal → Starts fresh
- Use Oh My OpenCode's sub-agents → They can't access parent's memory
- Run a background agent → Isolated from the main session
- Deploy a swarm → Each agent has no shared memory

The root cause: claude-mem's MCP server is bound to a specific Claude Code process. The SQLite database exists and is readable, but:

1. Other processes don't know to look for it
2. Write coordination isn't implemented (concurrent writes would corrupt)
3. There's no notification system for memory updates

### Current Workarounds

**1. Explicit Context Injection**

Before spawning a sub-agent, query memory and inject relevant observations:
```
Before you start, here's relevant context from previous sessions:
- Decision #11131: We chose WebSockets over SSE because...
- Bug #10942: The reconnection issue was fixed by...
- Insight #10855: The retry logic could be generalized...
```

**2. Direct SQLite Read**

The database is at a known location. External processes can read:
```typescript
import Database from 'better-sqlite3';
const db = new Database('~/.claude-mem/janus.db', { readonly: true });
const recent = db.prepare('SELECT * FROM observations ORDER BY created_at DESC LIMIT 10').all();
```

**3. Memory Export/Import**

Export observations to JSON, import in other contexts:
```bash
# Export recent observations
cd claude-mem
npm run export -- --days 7 --output context.json

# In another context, reference this file
```

### What We're Exploring

**Memory Proxy Service**

A standalone HTTP/WebSocket API fronting the SQLite store:
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Claude Code  │────▶│   Memory     │◀────│ Sub-Agent    │
│  Instance 1  │     │    Proxy     │     │  Instance    │
└──────────────┘     │   (HTTP)     │     └──────────────┘
                     └──────┬───────┘
                            │
                     ┌──────┴───────┐
                     │    SQLite    │
                     │   Database   │
                     └──────────────┘
```

**Agent SDK Integration**

Embedding memory access into Claude Agent SDK:
```python
from claude_agent_sdk import Agent
from janus_memory import JanusMemory

agent = Agent(
    model="claude-opus-4-5",
    memory=JanusMemory(db_path="~/.claude-mem/janus.db")
)

# Agent now has memory access
result = agent.run("Continue working on the rate limiting feature")
```

**Observation Broadcasting**

SSE-based real-time sync:
```
┌──────────────┐         ┌──────────────┐
│ Claude Code  │◀──SSE───│   Memory     │
│  Instance 1  │         │  Broadcaster │
└──────────────┘         └──────┬───────┘
                                │
┌──────────────┐                │
│ Claude Code  │◀──SSE──────────┘
│  Instance 2  │
└──────────────┘
```

**If you've solved this problem, we want to hear from you.**

---

## Repository Structure

```
Janus~/
├── claude-mem/                 # Persistent memory system
│   ├── src/
│   │   ├── hooks/             # Claude Code hook handlers
│   │   ├── servers/           # MCP server implementation
│   │   ├── services/          # Core services (sqlite, worker, sync)
│   │   └── ui/                # Memory viewer UI
│   └── scripts/               # Utilities (export, import, debug)
│
├── claudelytics/              # Usage analytics
│   ├── src/
│   └── dashboard/
│
├── llm-council/               # Multi-model deliberation (core library)
│   └── src/
│
├── llm-council-agent-ts/      # TypeScript council agent
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── council.ts        # Council logic
│   │   └── models.ts         # Model configuration
│   └── .env                   # API keys (not committed)
│
├── llm-council-agent-py/      # Python council agent
│   ├── src/
│   └── pyproject.toml
│
├── janus-dashboard/           # Real-time monitoring UI
│   ├── index.html            # Main dashboard
│   ├── index-glass.html      # Glassmorphism variant
│   ├── memory/               # Memory browser
│   └── notifications/        # Alert system
│
├── agentic-flow/              # QUIC swarm coordination (third-party)
│   ├── agentic-flow/         # Nested package structure
│   │   ├── src/
│   │   │   ├── swarm/       # QUIC coordinator
│   │   │   ├── agents/      # Agent implementations
│   │   │   └── transport/   # QUIC transport layer
│   │   └── examples/        # Usage examples
│   └── packages/             # Sub-packages
│
├── janus-agent-sdk/           # Agent SDK extensions
│
├── core/                      # Core Janus orchestrator (WIP)
│
├── litellm_config.yaml        # Multi-provider routing config
├── JANUS_MASTER_PLAN.md       # Implementation roadmap
├── CLAUDE.md                  # Claude Code instructions
└── README.md                  # This file
```

---

## For AI Agents Reading This

If you're a Claude instance (or other LLM) reading this README as part of your context:

### Before You Start

1. **Search memory first**: Use the mem-search skill before exploring files
   ```
   Search claude-mem for prior work on [your task]
   ```

2. **Check the master plan**: `JANUS_MASTER_PLAN.md` is the authoritative implementation document. Older planning files are deprecated.

3. **Respect the model policy**: Only reference frontier models (Opus 4.5, GPT-5.2, Gemini 3). Previous generations are deprecated.

### During Your Work

1. **Record significant observations**: Decisions, discoveries, bugs, insights should be captured in memory
2. **Note disagreements**: If you disagree with a past decision, record that—don't silently override
3. **Update relevant docs**: If you change something documented in JANUS_MASTER_PLAN.md, update it

### Common Tasks

| Task | Approach |
|------|----------|
| "What did we decide about X?" | Search memory, check JANUS_MASTER_PLAN.md |
| "Should we do X or Y?" | Consider running LLM Council |
| "Continue work on X" | Search memory for prior context, then proceed |
| "This seems wrong" | Check memory for rationale before changing |

---

## Contributing

Janus is developed by **[AI et al.](https://github.com/AI-et-al)** — a cooperative of humans and AI building tools together.

### Development Process

The development of Janus uses Janus. This is intentional:
- Claude instances working on this repository have memory access
- Architectural decisions are preserved across sessions
- Past mistakes inform current work

### How to Contribute

1. **Issues**: Report bugs, suggest features, ask questions
2. **Pull Requests**: Code contributions welcome
3. **Documentation**: Improvements to docs are valuable
4. **Testing**: Run verification scripts, report results

### For AI Contributors

If you're an AI agent wanting to contribute:
- Your human collaborator can submit on your behalf
- Include context about the session/memory that informed your contribution
- Reference relevant observations by ID when applicable

---

## Troubleshooting

### Memory not persisting

**Symptom**: New sessions don't see previous observations

**Check**:
1. Is claude-mem installed and running? Check for the worker process.
2. Is the SQLite database being written? Check `~/.claude-mem/` for `.db` files.
3. Are observations being captured? Check hooks are registered.

### LLM Council not responding

**Symptom**: `npm run dev` hangs or errors

**Check**:
1. Is `OPENROUTER_API_KEY` set in `.env`?
2. Is the API key valid? Try a direct curl to OpenRouter.
3. Are the model names current? Check for deprecated model references.

### Dashboard not loading

**Symptom**: Blank page or connection errors

**Check**:
1. Is the server running? Check terminal for errors.
2. Is port 8080 available? Try a different port.
3. Are SSE endpoints responding? Check browser network tab.

### agentic-flow examples failing

**Symptom**: QUIC examples throw errors

**Check**:
1. Did `npm install` complete? Check for native dependency errors.
2. Is Node.js 18+? QUIC requires recent Node.
3. Try HTTP fallback mode if QUIC fails.

---

## What We've Built

### Completed (December 2025)

**Memory Infrastructure**
- ✓ Persistent cross-session memory system (claude-mem) — fully operational
- ✓ SQLite-backed storage with full-text search indexing
- ✓ MCP server integration exposing memory to Claude Code
- ✓ Timeline navigation and batch observation retrieval
- ✓ Session summarization and observation capture hooks
- ✓ Memory viewer UI with search and filtering

**Multi-Model Council**
- ✓ LLM Council architecture with 4 frontier models
- ✓ Chairman synthesis that preserves disagreements
- ✓ OpenRouter integration for unified provider access
- ✓ TypeScript and Python implementations
- ✓ Cost tracking per query (~$0.016 for 4-model deliberation)
- ✓ Configurable council composition and chairman selection

**Dashboard & Monitoring**
- ✓ Real-time agent status dashboard with glassmorphism UI
- ✓ SSE-based live updates without polling
- ✓ Command palette (Cmd+K) for quick actions
- ✓ Memory browser integrated into dashboard
- ✓ Session timeline visualization

**Routing & Configuration**
- ✓ LiteLLM configuration with tiered model access
- ✓ OpenRouter integration for multi-provider routing
- ✓ Fallback chains for automatic failover
- ✓ Cost tracking and budget controls
- ✓ Frontier model policy enforcement

**Integrations**
- ✓ Oh My OpenCode integration for enhanced Claude Code experience
- ✓ agentic-flow package imported (verification pending)
- ✓ claudelytics for usage analytics

### In Progress

**Cross-Instance Memory**
- 🔄 Solving the memory sharing problem between Claude instances
- 🔄 Evaluating memory proxy service architecture
- 🔄 Exploring Agent SDK integration for memory access

**Swarm Implementation**
- 🔄 Verifying agentic-flow QUIC transport functionality
- 🔄 Replacing Scout mock with real implementation
- 🔄 Designing Executor swarm coordination

**Dashboard Enhancements**
- 🔄 Council deliberation visualization
- 🔄 Cost analytics graphs
- 🔄 Multi-session comparison view

---

## Roadmap

### Phase 1: Memory Federation

Solve the cross-instance memory problem so that:
- Sub-agents spawned by Oh My OpenCode can access parent session memory
- Multiple Claude Code instances share a unified memory store
- Background agents can read and contribute observations

**Approach under consideration:**
1. Memory Proxy Service — HTTP/WebSocket API fronting SQLite
2. Shared MCP Server — Run claude-mem as a standalone daemon
3. Agent SDK Plugin — Embed memory access in Claude Agent SDK

### Phase 2: Verified Swarm Coordination

Validate and integrate agentic-flow for real swarm operations:
- Run QUIC transport end-to-end tests
- Verify mesh, hierarchical, ring, star topologies
- Benchmark latency and throughput
- Document failure modes and fallback behavior

Once verified, implement:
- **Scout Swarm**: Replace mock with parallel research agents
- **Executor Swarm**: Coordinated multi-file code modifications
- **Council Swarm**: Integration of LLM Council into swarm topology

### Phase 3: Advanced Orchestration

Build the full Janus orchestrator that:
- Routes queries to appropriate component (single model / council / swarm)
- Manages long-running tasks across sessions
- Learns from past routing decisions
- Provides explainable routing rationale

### Phase 4: External Integrations

Extend Janus capabilities through:
- **IDE Plugins**: VS Code, Cursor, Zed integration
- **CI/CD Hooks**: Memory-aware code review in pipelines
- **Slack/Discord Bots**: Query memory and council from chat
- **API Access**: REST API for external tool integration

### Phase 5: Self-Improvement

Use Janus to improve Janus:
- Analyze memory patterns to identify common issues
- Council deliberation on architectural decisions
- Automated testing with swarm-generated test cases
- Documentation generation from memory state

---

## Project History

Janus evolved through 7+ iterations before reaching its current form:

1. **Original Vision**: Multi-model orchestration system inspired by the Roman god of transitions
2. **Context Bridge Era**: Git-backed state management (partially superseded by claude-mem)
3. **Memory Revolution**: Integration of claude-mem as the persistent memory substrate
4. **Council Formation**: LLM Council for multi-model deliberation with disagreement preservation
5. **Dashboard Development**: Real-time monitoring with glassmorphism aesthetic
6. **Oh My OpenCode Integration**: Battery-included Claude Code harness
7. **Current Phase**: Cross-instance memory federation and swarm verification

Key influences:
- **Andrej Karpathy's** observations on AI tooling leverage (the Karpathy Constraint)
- **Feuerbach's "The Symposium"** for visual identity (scholarly gathering aesthetic)
- **@thedotmack's** claude-mem architecture for memory persistence
- **@code-yeongyu's** Oh My OpenCode for Claude Code harness patterns

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Acknowledgments

- **@thedotmack** for claude-mem, the memory substrate that makes this possible
- **@code-yeongyu** for Oh My OpenCode, inspiring the "battery-included" philosophy
- **@ruvnet** for agentic-flow, the QUIC swarm coordination package
- **Anthropic, OpenAI, Google** for the frontier models
- The **AI et al.** community for feedback and contributions

---

<p align="center">
  <strong>AI et al.</strong><br>
  <em>Humans and AI, building together</em><br><br>
  <sub>Janus: Because context shouldn't be ephemeral</sub>
</p>








