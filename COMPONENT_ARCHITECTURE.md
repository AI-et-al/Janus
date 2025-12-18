# Janus Component Architecture: How Each Project Powers the Multi-Model Council

## Overview

Janus is built by composing four complementary projects, each providing a critical capability for multi-model deliberation and bounded agent execution. This document explains exactly what each project does, why Janus needs it, and how they integrate.

---

## 1. LLM-Council: The Multi-Model Deliberation Engine

### What It Does

**llm-council** implements a three-stage deliberation protocol where multiple language models reason together:

```
Stage 1: Independent Reasoning
├─ Prompt sent to Claude, GPT, Gemini in parallel
├─ Each generates a response with confidence level
└─ All responses collected without filtering

Stage 2: Peer Review (Anonymized)
├─ Each LLM sees other models' responses (identity hidden)
├─ Tasked to rank them on accuracy, insights, completeness
└─ Models expose their disagreements and reasoning gaps

Stage 3: Synthesis
└─ Chairman LLM creates final response from Stage 2 rankings
```

### Why Janus Needs It

The core insight of Janus is that **disagreement is the most valuable signal**. When Claude says "this is a security risk" and GPT says "this is standard practice," that delta is not noise—it's what you actually need to understand.

llm-council's Stage 2 is crucial because it forces models to engage with competing perspectives, not just deliver isolated opinions. This creates observable, rankable disagreement rather than just collecting responses.

### Technical Stack

- **Backend**: FastAPI (Python) async HTTP server
- **Frontend**: React + Vite
- **API Layer**: OpenRouter (100+ LLM models)
- **Data Storage**: JSON files in `data/conversations/`
- **Configuration**: `backend/config.py` for council composition

### How Janus Uses It

1. **Council Assembly**: Janus allows users to define councils dynamically
   - Default: Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Pro
   - Customizable: Add/remove models, swap Chairman

2. **Deliberation Trigger**: When a user asks a question, Janus:
   - Sends to llm-council's Stage 1 (parallel independent responses)
   - Collects Stage 2 peer reviews
   - Uses Stage 3 synthesis as optional summary

3. **Disagreement Detection**: Janus monitors:
   - Where confidence correlates/anti-correlates across models
   - Which models agree vs. diverge on specific aspects
   - Areas of high uncertainty (all models express doubt)

4. **Observable Output**: User sees all three stages with:
   - Individual responses in tabs
   - Each model's rankings of other responses
   - Chairman's synthesis (optional)
   - Diff highlighting showing disagreement zones

### Configuration

Models are defined in `backend/config.py`:

```python
COUNCIL_MODELS = [
    "anthropic/claude-3-5-sonnet",
    "openai/gpt-4-turbo",
    "google/gemini-2-pro"
]
CHAIRMAN_MODEL = "anthropic/claude-3-opus"  # Final synthesis
```

### API Key Requirement

Requires OpenRouter API key: `OPENROUTER_API_KEY=sk-or-v1-...`

---

## 2. Claudelytics: Observable Usage & Cost Tracking

### What It Does

**claudelytics** is a Rust CLI tool that analyzes Claude Code usage patterns with three key features:

```
Core Capabilities:
├─ Daily/Session Reporting: Token counts, costs, patterns by day/session
├─ Interactive TUI: Fuzzy-searchable session browser with 9 analytics tabs
└─ Real-time Monitoring: Live dashboard with token burn rate and cost projections
```

Key features:
- **Billing Block Tracking**: Groups usage in Claude's 5-hour UTC blocks
- **Model Filtering**: Separate analysis by Claude model (Opus, Sonnet, Haiku)
- **Cost Summaries**: Daily, total, or by billing block
- **CSV Export**: Pipe data to other analysis tools
- **Shell Integration**: Bash/Fish/Zsh aliases for quick commands

### Why Janus Needs It

The "Karpathy Constraint" in Janus is about transparency: nothing happens in the dark. Users need to understand:
- How much multi-model deliberation costs (3 models = 3x query cost)
- How many tokens each stage consumes
- Whether optimization (cheaper models for cheaper tasks) is working

Claudelytics answers these questions in real-time.

### Technical Stack

- **Language**: Rust (compiled binary)
- **Data Source**: Claude Code analytics output
- **UI**: Full-featured TUI with peco-style fuzzy search
- **Output Formats**: Table view, cards, JSON, CSV export
- **Performance**: Parallel processing via rayon, sub-ms latency with AgentDB v2

### How Janus Uses It

1. **Post-Session Cost Report**: After deliberation, Janus shows:
   - Tokens consumed by each model
   - Cost per deliberation stage
   - Total cost vs. single-model baseline

2. **Budget Monitoring**: Warns when:
   - Daily/weekly cost exceeds user threshold
   - Particular council composition is expensive
   - Cheaper alternative models available

3. **Session Analysis**: Provides detailed breakdown:
   - Which model generated the most valuable insights
   - Correlation between tokens spent and disagreement quality
   - Cost-per-usefulness metric

4. **Performance Insights**: Tracks:
   - Latency of each deliberation stage
   - Model response times
   - Optimization effectiveness (e.g., parallel Stage 1 speedup)

### Configuration

Uses YAML config file `~/.config/claudelytics/config.yaml`:
```yaml
watch_interval: 5s  # Real-time monitoring
output_format: table  # table, json, csv
billing_alert_threshold: $100  # Daily budget
```

### Usage Examples

```bash
# Quick cost check for today
claudelytics cost --today

# Interactive session browser
claudelytics tui --enhanced

# Real-time monitoring
claudelytics watch

# Export for reporting
claudelytics export --format csv --since 2025-01-01
```

---

## 3. Agentic-Flow: The Execution & Learning Engine

### What It Does

**agentic-flow** is a framework for creating specialized agents that execute bounded tasks with learning:

```
Core Architecture:
├─ 54 Specialized Agents
│  ├─ Core: coder, tester, reviewer, planner, researcher
│  ├─ Consensus: byzantine-coordinator, raft-manager, gossip-coordinator
│  └─ Performance: perf-analyzer, memory-coordinator, task-orchestrator
├─ Agent Booster: 352x faster code operations (local WASM transforms)
├─ ReasoningBank: Persistent learning memory (semantic search over past decisions)
├─ Multi-Model Router: Intelligent cost optimization across 100+ LLMs
├─ AgentDB v2: Vector database with GNN learning
├─ Federation Hub: Ephemeral agents with persistent cross-agent memory
└─ Swarm Optimization: Self-learning parallel execution topologies
```

Performance gains:
- **Agent Booster**: Single edit 352ms → 1ms (99.7% faster, $0 cost)
- **ReasoningBank**: First attempt 70% → 90%+ success after learning
- **Swarm Optimization**: 3-5x speedup with auto-topology selection

### Why Janus Needs It

Janus follows the "Karpathy Constraint": everything happens in bounded chunks. Subagents (Scouts, Executors) must be:
- **Fast**: Execute tasks without prolonged deliberation
- **Observable**: Report back after each task
- **Learnable**: Improve on repeated tasks
- **Specialized**: Different agents for different subtasks
- **Coordinated**: Work together without centralized control

Agentic-flow provides all of this.

### Technical Stack

- **Language**: TypeScript + JavaScript (Node.js 18+)
- **Package Manager**: npm with `claude-flow` CLI
- **Core Components**: MCP-integrated, 213 MCP tools
- **Database**: AgentDB v2 (RuVector-powered graph DB)
- **Transport**: QUIC protocol for low-latency agent communication
- **Deployment**: Standalone Node.js, Docker, Kubernetes

### How Janus Uses It

#### A. Subagent Swarms

1. **Scout Swarm** (Haiku-class agents)
   - **Task**: Verify resources exist before work begins
   - **From agentic-flow**: `researcher` agent pattern + QUIC transport
   - **Example**: "Check if npm package X version Y exists"
   - **Output**: Success/failure + working link or error code
   - **Constraint**: Not allowed to speculate

2. **Executor Swarm** (Haiku-class agents)
   - **Task**: Implement actual work from decisions made by Council
   - **From agentic-flow**: `coder` agent + Agent Booster for fast edits
   - **Example**: "Write authentication module in TypeScript following these constraints"
   - **Output**: Code + test results + error handling report
   - **Learning**: ReasoningBank remembers past implementations

3. **Reviewer Swarm** (Haiku-class agents)
   - **Task**: Check work quality before user sees it
   - **From agentic-flow**: `reviewer` agent + code analysis tools
   - **Example**: "Check for security issues in this OAuth implementation"
   - **Output**: Issues found + severity + remediation suggestions

#### B. The Council (Opus-class deliberation)

```
Janus Council Setup (using agentic-flow's Multi-Model Router):
├─ Primary: Claude 3.5 Opus (reasoning, security implications)
├─ Comparison: OpenAI GPT-4o (structured responses, code quality)
├─ Diversity: Google Gemini 2.0 (breadth, alternative approaches)
└─ Cost Router: Auto-selects cheaper models for low-risk questions
```

Uses **Multi-Model Router** to:
- Route high-stakes decisions to Opus
- Use cheaper models (Sonnet, Haiku, GPT-4o-mini) for straightforward tasks
- Achieve 85-99% cost savings on suitable questions
- Track cost vs. quality tradeoff

#### C. Persistent Learning Loop

```
Janus Learning Architecture (using ReasoningBank):

User Query
    ↓
Council Deliberation (llm-council Stage 1-3)
    ↓
Decision Made
    ↓
Executors Implement → ReasoningBank stores:
├─ Decision context
├─ Execution path taken
├─ Success/failure + why
└─ Alternative approaches considered

Next Similar Query
    ↓
ReasoningBank semantic search finds similar past decision
    ↓
Suggest "We solved similar problem before, here's what worked"
```

#### D. Coordination & Swarm Execution

Uses agentic-flow's **Swarm Optimization** for:
- Selecting optimal agent topology (mesh, hierarchical, ring)
- Parallel execution of independent scouts
- Sequential execution of dependent stages (scouts → deliberation → executors)
- Load balancing across available models

Example flow:
```
[User Input]
    ↓
[3 Scouts in parallel] → Check URLs, verify packages, validate resources
    ↓
[Council Deliberation] → Sequential (waits for scout reports)
    ↓
[3 Executors in parallel] → Implement decided approach
    ↓
[Reviewer] → Quality check
    ↓
[Report to User]
```

### Agent Mapping to Janus Roles

| Janus Role | agentic-flow Agent | Purpose |
|-----------|-------------------|---------|
| Scout | `researcher` | Verify resources, check links |
| Executor | `coder` + `tester` | Implement decisions, validate |
| Reviewer | `reviewer` | Code quality, security, correctness |
| Deliberator | Multi-Model Router | Route Council questions optimally |
| Learner | ReasoningBank | Store & retrieve past decisions |
| Coordinator | `hierarchical-coordinator` | Manage swarm topology |

### Configuration

```typescript
// Janus agent configuration using agentic-flow
import { SwarmLearningOptimizer } from 'agentic-flow/hooks/swarm-learning-optimizer';
import { ReasoningBank } from 'agentic-flow/agentdb';
import { ModelRouter } from 'agentic-flow/router';

// Define swarm topology
const swarmConfig = {
  scouts: { count: 3, model: 'claude-3-5-haiku' },
  executors: { count: 3, model: 'claude-3-5-haiku' },
  reviewers: { count: 2, model: 'claude-3-5-sonnet' },
  council: ['claude-3-5-opus', 'gpt-4o', 'gemini-2-pro']
};

// Learning system
const reasoningBank = new ReasoningBank();
const router = new ModelRouter();
```

---

## 4. Integration: How They Work Together

### Complete Janus Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
│ "Should we use OAuth 2.0 or JWT for authentication?"            │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   SCOUT PHASE (agentic-flow)    │
        │ (3 parallel agents)              │
        ├─────────────────────────────────┤
        │ • Verify OAuth 2.0 specs exist  │
        │ • Check JWT implementations     │
        │ • Validate reference libraries  │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │ COUNCIL DELIBERATION            │
        │ (llm-council + agentic-flow)    │
        ├─────────────────────────────────┤
        │ Stage 1: Three models respond   │
        │ ├─ Claude: OAuth 2.0 + PKCE     │
        │ ├─ GPT: JWT with RSA signing   │
        │ └─ Gemini: PASETO framework    │
        │                                 │
        │ Stage 2: Peer review (anon)    │
        │ ├─ Claude ranks GPT response   │
        │ ├─ GPT evaluates Gemini       │
        │ └─ Gemini critiques Claude    │
        │                                 │
        │ Stage 3: Chairman synthesis    │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  DECISION LOGGED               │
        │ (ReasoningBank)                │
        │ • Decision context             │
        │ • Confidence levels            │
        │ • Disagreement zones           │
        │ • Execution path chosen        │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   EXECUTOR PHASE               │
        │ (agentic-flow Executors)       │
        │ (3 parallel agents)            │
        ├─────────────────────────────────┤
        │ • Agent 1: Implement OAuth 2.0 │
        │ • Agent 2: Implement JWT       │
        │ • Agent 3: Implement reference │
        │                                 │
        │ (Agent Booster speeds up 352x) │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │    REVIEWER PHASE              │
        │ (agentic-flow Reviewers)       │
        ├─────────────────────────────────┤
        │ • Security analysis            │
        │ • Code quality check           │
        │ • Test coverage                │
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   COST TRACKING & REPORTING    │
        │ (claudelytics)                 │
        ├─────────────────────────────────┤
        │ • Stage 1 tokens: 3,250        │
        │ • Stage 2 tokens: 2,180        │
        │ • Stage 3 tokens: 1,045        │
        │ • Execution tokens: 8,920      │
        │ • Total cost: $0.42            │
        │ • Savings vs 3x single model: 15%│
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │  REPORT TO USER                │
        │ ┌─────────────────────────────┐ │
        │ │ Council Responses (tabs)    │ │
        │ ├─────────────────────────────┤ │
        │ │ Option A: OAuth 2.0 (85%)   │ │
        │ │ Option B: JWT (78%)         │ │
        │ │ Option C: PASETO (72%)      │ │
        │ ├─────────────────────────────┤ │
        │ │ ⚠ DISAGREEMENT: Replay      │ │
        │ │   vulnerability assessment  │ │
        │ │   differs across models     │ │
        │ ├─────────────────────────────┤ │
        │ │ Reference Implementations   │ │
        │ │ • OAuth 2.0: ready (3 files)│ │
        │ │ • JWT: ready (2 files)      │ │
        │ │ • PASETO: ready (1 file)    │ │
        │ │                             │ │
        │ │ Cost: $0.42, 15% savings    │ │
        │ └─────────────────────────────┘ │
        └────────────────────────────────┘
```

### Data Flow Between Components

```
┌──────────────────┐
│  llm-council     │
│  Multi-Model     │ ← OpenRouter API (100+ models)
│  Deliberation    │
└────────┬─────────┘
         │
         ├─ Stage 1-3 responses
         │
┌────────▼────────────────────┐
│  agentic-flow              │
│  ├─ Multi-Model Router     │ ← Decision routing
│  ├─ ReasoningBank          │ ← Store/retrieve past decisions
│  └─ Swarm Executors        │ ← Implement chosen approach
└────────┬────────────────────┘
         │
         ├─ Tokens consumed (each agent)
         │
┌────────▼──────────────────┐
│  claudelytics            │
│  Cost Analysis & Reporting│
└──────────────────────────┘
```

---

## 5. Code Leverage Breakdown

### What Can Be Reused from Each Project

#### From llm-council

- ✅ **Council Assembly & Composition**: Define which models participate
- ✅ **Three-Stage Protocol**: Stage 1 (independent), Stage 2 (peer review), Stage 3 (synthesis)
- ✅ **Anonymization Logic**: Hide model identities during Stage 2 ranking
- ✅ **OpenRouter Integration**: Multi-model API abstraction
- ✅ **Conversation Storage**: JSON persistence pattern
- ⚠️ **React Frontend**: UI paradigm useful, but Janus may have custom deliberation UX
- ❌ **Single-Session Model**: Janus needs multi-session, persistent memory

#### From claudelytics

- ✅ **Usage Analytics Pipeline**: Token counting, cost tracking
- ✅ **TUI Components**: Table rendering, fuzzy search UI patterns
- ✅ **Shell Integration**: Bash/Zsh alias patterns for CLI commands
- ✅ **CSV Export**: Data pipeline for external analysis
- ⚠️ **Session Browser**: Pattern useful, adapted for Council deliberations
- ❌ **Claude-Specific Analytics**: Janus tracks multi-model costs, not just Claude

#### From agentic-flow

- ✅ **Agent Library**: All 54 agents available (Scouts, Executors, Reviewers, Coordinators)
- ✅ **Agent Booster**: WASM-based fast code transformation (352x speedup)
- ✅ **ReasoningBank**: Persistent learning memory with semantic search
- ✅ **Multi-Model Router**: Cost-aware model selection
- ✅ **AgentDB v2**: Graph database for decision storage and retrieval
- ✅ **Federation Hub**: Ephemeral agent spawning with persistent state
- ✅ **Swarm Optimization**: Automatic topology selection and parallelization
- ✅ **QUIC Transport**: Low-latency agent-to-agent communication
- ✅ **MCP Integration**: 213 MCP tools for extended capabilities
- ✅ **SPARC Workflow**: Specification→Pseudocode→Architecture→Refinement→Completion
- ⚠️ **Kubernetes Controller**: Enterprise feature, optional for Janus

---

## 6. Architectural Decisions for Janus

### Decision: Multi-Model vs. Single Council

**Choice**: Janus maintains multiple councils (not just one fixed group)

**Rationale**:
- Some questions benefit from broad diversity (Gemini excels at breadth)
- Some require deep reasoning (Opus for security implications)
- Different questions have different cost/benefit curves
- agentic-flow's Multi-Model Router handles this dynamically

### Decision: Synchronous User Interaction

**Choice**: User stays in the loop; nothing happens invisible

**Rationale**:
- Follows Karpathy Constraint: bounded chunks only
- User sees Stage 1, Stage 2, Stage 3 in real-time
- User approves before Executors begin work
- claudelytics reports cost *before* authorization

### Decision: Persistent Learning Across Sessions

**Choice**: ReasoningBank stores every decision for future reference

**Rationale**:
- "Similar question before?" matters more than individual model accuracy
- Past disagreement patterns inform future councils
- Execution paths learned from failure improve next time
- agentic-flow's AgentDB v2 enables efficient semantic search

### Decision: Ephemeral Swarms with Persistent Context

**Choice**: Spawn executors dynamically, keep memory permanent

**Rationale**:
- Agent swarms don't need permanent identity (ephemeral)
- But their reasoning must accumulate (persistent)
- agentic-flow's Federation Hub enables this pattern

---

## 7. Dependency Summary

| Component | Purpose | Type | Status |
|-----------|---------|------|--------|
| **llm-council** | Multi-model deliberation | Python FastAPI | ✅ Ready |
| **claudelytics** | Cost tracking & analytics | Rust CLI | ✅ Ready |
| **agentic-flow** | Agent execution & learning | TypeScript npm | ✅ Ready |
| **Claude Agent SDK** | Subagent spawning | Anthropic API | ✅ Ready |
| **OpenRouter** | LLM API gateway | Cloud service | ⚠️ API key required |

---

## 8. Next Steps for Implementation

1. **Phase 1: Council Integration**
   - Integrate llm-council backend into Janus
   - Connect to agentic-flow's Multi-Model Router
   - Test Stage 1-3 execution

2. **Phase 2: Executor Swarms**
   - Spawn agentic-flow Executor agents
   - Implement bounded task execution
   - Connect to Agent Booster for speed

3. **Phase 3: Learning Loop**
   - Connect ReasoningBank for decision storage
   - Implement semantic search for past decisions
   - Add cost-optimization routing

4. **Phase 4: Cost Visibility**
   - Integrate claudelytics reporting
   - Real-time cost dashboards
   - Budget alerts and optimization suggestions

5. **Phase 5: Observable Deliberation UI**
   - Show Council responses in real-time tabs
   - Highlight disagreement zones
   - Surface uncertainty metrics

