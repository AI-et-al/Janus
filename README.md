# JANUS

```
      ╔═══════════════════════════════════════════════════════════╗
      ║                                                           ║
      ║                    JANUS: THE TWO-FACED ORACLE            ║
      ║                                                           ║
      ║     Multi-Model Deliberation meets Bounded Execution     ║
      ║                                                           ║
      ║    "The map is not the territory, but three maps from    ║
      ║    different cartographers gives you a better sense of   ║
      ║                where the territory actually is."         ║
      ║                                                           ║
      ╚═══════════════════════════════════════════════════════════╝


                           ⚡ JANUS HEAD ⚡
                        (Looking both ways)

                              ╱─╲
                             ╱   ╲
                            │  ◆  │
                            │ ◆ ◆ │
                             ╲   ╱
                              ╲─╱
                             ╭─┴─╮
                             │   │
                            ╱   ╲


        Council Deliberation → Observable Disagreement → Bounded Execution
```

---

## The Problem With Asking One Oracle

Here's something that bothered me: we have access to multiple frontier language models, each trained on slightly different data with slightly different architectures and slightly different RLHF, and our default interaction pattern is to pick one and trust it.

This is like having access to three doctors who went to different medical schools, trained in different hospitals, and developed different clinical intuitions—and only ever consulting one of them. The interesting information is often in *where they disagree*.

When Claude says "this approach has serious security implications" and GPT says "this is standard practice," that delta isn't noise. It's signal. It's the thing you actually want to know about. But our tools hide it from us, because our tools are built around the assumption that you want *an answer*, not *a map of the answer space*.

Janus is an attempt to fix this.

---

## What This Actually Is

Janus is built by integrating four complementary projects into a cohesive system for multi-model deliberation and bounded execution:

### The Three-Stage Council Deliberation

Three language models—Claude, GPT, Gemini—receive the same prompt in parallel (via **llm-council**):

```
┌────────────────────────────────────────────────────────────┐
│                    STAGE 1: INDEPENDENT OPINIONS            │
├──────────────────┬──────────────────┬──────────────────────┤
│      CLAUDE      │       GPT        │       GEMINI         │
│                  │                  │                      │
│  "OAuth 2.0 with │  "JWT with RSA   │  "Consider PASETO,   │
│   PKCE. Note the │   signing. PKCE  │   it addresses JWT   │
│   token refresh  │   has replay     │   weaknesses. Also:  │
│   race condition │   risks if..."   │   what's your scale?"│
│                  │                  │                      │
│  Confidence: 85% │  Confidence: 78% │  Confidence: 72%     │
└──────────────────┴──────────────────┴──────────────────────┘

                              ↓

┌────────────────────────────────────────────────────────────┐
│            STAGE 2: PEER REVIEW (ANONYMIZED)               │
├────────────────────────────────────────────────────────────┤
│  "Model A's response addresses replay risks well, but      │
│   Model B suggests a solution I hadn't considered. Model   │
│   C raises an important scalability question that both A   │
│   and B avoid."                                            │
│                                                            │
│  Ranking: C (breadth) > A (security) > B (missing scale)  │
└────────────────────────────────────────────────────────────┘

                              ↓

┌────────────────────────────────────────────────────────────┐
│          STAGE 3: SYNTHESIS (CHAIRMAN)                     │
├────────────────────────────────────────────────────────────┤
│  "Three defensible approaches exist. OAuth 2.0 wins on     │
│   security and maturity. JWT wins on simplicity. PASETO    │
│   wins on modern design. Key disagreement: how to handle   │
│   refresh tokens in distributed systems."                 │
└────────────────────────────────────────────────────────────┘

                              ↓

                  ⚠ DISAGREEMENT DETECTED
              (The most valuable signal Janus offers)
```

The Council doesn't vote. It doesn't synthesize into mush. It **presents its disagreements to you** because its disagreements are the most valuable thing it has to offer.

---

## The Projects Powering Janus

Janus is not built from scratch. It's a composition of four production-ready projects, each providing a critical capability:

### 1. **llm-council**: Multi-Model Deliberation Engine
([See full breakdown](./COMPONENT_ARCHITECTURE.md#1-llm-council-the-multi-model-deliberation-engine))

**What it does**: Orchestrates the three-stage protocol where multiple LLMs deliberate together.

**Technical stack**: FastAPI backend + React frontend, uses OpenRouter for 100+ model access.

**Janus uses it for**:
- Council assembly (which models participate)
- Three-stage deliberation protocol
- Anonymization during peer review
- Disagreement capture and ranking

**Performance**: Stage 1-3 complete in parallel, minimal latency between stages.

```
User Query → Stage 1 (3 models parallel) → Stage 2 (peer review) → Stage 3 (synthesis) → User sees all stages
```

### 2. **claudelytics**: Observable Usage & Cost Tracking
([See full breakdown](./COMPONENT_ARCHITECTURE.md#2-claudelytics-observable-usage--cost-tracking))

**What it does**: Real-time cost tracking and usage analytics for AI operations.

**Technical stack**: Rust CLI, TUI interface, parallel processing via rayon.

**Janus uses it for**:
- Cost reporting after each deliberation
- Budget monitoring and alerts
- Session analysis (which models generated valuable insights)
- Export for external analysis

**Performance**: Sub-millisecond latency, handles large datasets efficiently.

**Key insight**: Multi-model deliberation costs 3x single queries. claudelytics shows exactly where money goes and enables optimization.

### 3. **agentic-flow**: Execution & Learning Engine
([See full breakdown](./COMPONENT_ARCHITECTURE.md#3-agentic-flow-the-execution--learning-engine))

**What it does**: Framework for specialized agents that execute tasks with persistent learning.

**Components leveraged**:
- **54 Specialized Agents**: Scouts (researchers), Executors (coders/testers), Reviewers (quality checkers)
- **Agent Booster**: 352x faster code operations via WASM transforms ($0 cost)
- **ReasoningBank**: Persistent learning memory with semantic search (46% faster on repeated tasks)
- **Multi-Model Router**: Intelligent cost optimization across 100+ LLMs (85-99% savings on suitable tasks)
- **AgentDB v2**: Vector database with GNN learning for decision storage
- **Federation Hub**: Ephemeral agents with persistent context
- **Swarm Optimization**: Self-learning parallel execution topologies (3-5x speedup)

**Janus uses it for**:
- Scout swarms (verify resources before work)
- Executor swarms (implement decisions from Council)
- Reviewer swarms (quality gates before user approval)
- Learning loop (remember past decisions for similar questions)
- Cost optimization (route simple questions to cheaper models)

**Performance**: Agent Booster makes code edits 352x faster, ReasoningBank prevents repeated mistakes.

---

## Why Bother

Language models are compressed representations of human knowledge. Different models compress differently. They have different priors, different blindspots, different strengths.

GPT tends toward confident, structured responses. Claude tends toward nuance and hedging. Gemini tends toward breadth. These aren't bugs—they're features of different training regimes that captured different aspects of the space of reasonable responses.

When you query one model, you get one sample from one distribution. When you query three and look at their **disagreements**, you get something closer to the **shape of the uncertainty**. You learn not just "what might be true" but "what the range of defensible positions looks like."

This is useful if you're trying to make decisions rather than just get answers.

### The Cost Angle

Multi-model deliberation costs more upfront (3x queries). But:
- **Reduced decision errors** (better reasoning catches mistakes early)
- **Fewer iterations** (you don't ask follow-up questions because you see the whole disagreement map upfront)
- **Smarter model routing** (agentic-flow's Multi-Model Router saves 85-99% on suitable tasks)
- **Learning loop prevents repeats** (ReasoningBank means you don't solve the same problem twice)

Net result: Often cheaper than single-model iteration cycles that require follow-ups.

---

## The Karpathy Constraint

There's a failure mode in AI tooling where the tool tries to be impressive. It goes off for twenty minutes and comes back with a thousand lines of code and you have no idea if any of it is right.

Andrej Karpathy has been pretty clear about not wanting this:

> *"I want to mass-execute short tasks, looking at each one... I don't want the agent to go off for 20 minutes and mass-execute 50 writes."*

Janus follows this principle religiously:

- **Everything happens in chunks you can hold in your head**
  - User sees Stage 1, 2, 3 responses in real-time
  - Disagreements are highlighted before implementation begins

- **The Council proposes, you approve**
  - Council generates options with confidence levels
  - User chooses which path to execute
  - Nothing happens without explicit approval

- **Subagents execute bounded tasks and report back**
  - Scouts verify resources (takes seconds)
  - Executors implement specific decisions (defined scope)
  - Reviewers validate output before delivery

- **Cost is transparent before execution**
  - claudelytics reports Stage 1-3 cost
  - User sees total cost before Executors begin work
  - Budget alerts prevent surprises

If you want an AI that disappears for an hour and returns with a fait accompli, this isn't it. If you want to stay in the loop while AIs do the cognitive heavy lifting, this might be useful.

---

## Architecture (Complete Version)

### Layer 1: Strategic Reasoning (Claude.ai)

**Where**: Claude.ai interface (your browser)

**What happens**: You think through problems, ask clarifying questions, make architectural decisions. This is human-in-the-loop reasoning, not automated.

**Context**: Connected to persistent memory via git-backed Context Bridge.

### Layer 2: Council Deliberation (llm-council + agentic-flow)

**Where**: Runs locally or cloud-deployed

**What happens**:
1. User submits question to Janus CLI
2. **Scout phase** (agentic-flow Scouts): Verify preconditions, check resources
3. **Council phase** (llm-council): Run Stage 1-3 deliberation
4. **User approval**: View disagreements, select execution path

**Models involved**:
- Three council members (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Pro)
- One chairman (Claude 3.5 Opus, for synthesis)
- Multi-model router (agentic-flow) for optimization

### Layer 3: Execution (agentic-flow Executors)

**Where**: Local via Claude Agent SDK

**What happens**:
1. **Executor phase**: Parallel agents implement chosen approach
   - Uses Agent Booster for 352x faster code ops
   - Stores reasoning in ReasoningBank
2. **Reviewer phase**: Quality gates before delivery
3. **Context Bridge**: Decision logged for future reference

**Performance**: Agent Booster makes execution fast, ReasoningBank prevents repeated errors.

### Layer 4: Cost Visibility (claudelytics)

**Where**: Integrated throughout

**What happens**:
- Pre-execution: Cost estimate for Council deliberation
- Post-execution: Detailed token breakdown by stage and model
- Continuous: Budget monitoring, alerts, optimization suggestions

**Output**: Real-time dashboards, CSV exports, TUI browser.

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ USER INPUT (Question or Decision to Make)                    │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ SCOUT PHASE (agentic-flow)                                   │
│ ├─ Verify URLs, package versions, resource availability      │
│ ├─ Run in parallel (3 scouts)                                │
│ └─ Report success/failure                                    │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ COUNCIL DELIBERATION (llm-council + agentic-flow)            │
│ ├─ STAGE 1: Three models generate responses (parallel)       │
│ ├─ STAGE 2: Peer review with anonymized identities          │
│ └─ STAGE 3: Chairman synthesizes rankings                   │
│                                                              │
│ Router (agentic-flow): Route complex Q to expensive models,  │
│                       simple Q to cheap models               │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ COST ESTIMATE (claudelytics)                                 │
│ └─ Total cost for Stage 1-3, per-model breakdown             │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ USER REVIEW & APPROVAL                                       │
│ ├─ See all three Council responses in tabs                   │
│ ├─ View peer ranking and disagreements                       │
│ └─ Select execution path (or ask follow-up)                 │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ EXECUTOR PHASE (agentic-flow)                                │
│ ├─ Implement chosen approach (parallel executors)            │
│ ├─ Agent Booster: 352x faster code edits                    │
│ ├─ ReasoningBank: Learn from past similar tasks             │
│ └─ Run tests and validate                                    │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ REVIEW PHASE (agentic-flow Reviewers)                        │
│ ├─ Security analysis                                         │
│ ├─ Code quality check                                        │
│ └─ Test coverage validation                                  │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ COST REPORT (claudelytics)                                   │
│ ├─ Tokens per stage: Stage 1 | Stage 2 | Stage 3 | Execution│
│ ├─ Cost per model (3 council + chairman + executors)        │
│ ├─ Total cost + savings vs single-model approach            │
│ └─ Budget impact and remaining allocation                    │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ CONTEXT BRIDGE (Git-backed persistent memory)                │
│ ├─ Decision context saved                                    │
│ ├─ Execution path recorded                                   │
│ ├─ Cost and time metrics logged                              │
│ └─ Disagreement patterns learned for future                 │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ USER GETS RESULT                                             │
│ ├─ Working implementation                                    │
│ ├─ Full reasoning visible (Council deliberation)             │
│ ├─ Cost transparency (exactly what was spent)                │
│ └─ Decision saved (improves future recommendations)          │
└──────────────────────────────────────────────────────────────┘
```

---

## Constraints As Features

The Manifesto (which every subagent receives) includes this rule:

> When the human specifies a constraint, treat it as sacred. "Must use OAuth 2.0" means OAuth 2.0, not "here's why you should consider alternatives."

This sounds obvious but most AI tooling gets it wrong. The model optimizes for appearing helpful, which often means offering alternatives to what you asked for. But you have context the model doesn't. Your constraints encode decisions already made. Respecting them is respecting your judgment.

If you ask Janus for TypeScript, you get TypeScript. If you ask for minimal dependencies, you don't get a framework recommendation. The sophistication is in working within constraints, not in escaping them.

---

## Current Status

### Components & Integration

Janus is now architected as a composition of four production-ready projects:

✅ **Verified and Ready**:
- [x] **llm-council**: Multi-model deliberation (Stage 1-3 protocol working)
- [x] **claudelytics**: Cost tracking and usage analytics (Rust CLI, TUI interface)
- [x] **agentic-flow**: Agent framework with 54 specialized agents, ReasoningBank, Agent Booster, Multi-Model Router
- [x] **Claude Agent SDK**: Subagent spawning and coordination

📋 **Architecture & Planning**:
- [x] Complete component architecture documented ([COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md))
- [x] Data flow mapped (Scout → Council → Executor → Reviewer → Report)
- [x] Code reuse analysis completed (what to leverage from each project)
- [x] Integration strategy defined (4 layers: Strategic, Deliberation, Execution, Cost Visibility)

🏗️ **Implementation Roadmap**:

**Phase 1: Council Integration** (Priority: High)
- Integrate llm-council backend into Janus
- Connect to agentic-flow's Multi-Model Router
- Test Stage 1-3 execution with real LLM queries

**Phase 2: Executor Swarms** (Priority: High)
- Spawn agentic-flow Executor agents from Council decisions
- Implement bounded task execution
- Connect to Agent Booster for 352x speed improvement

**Phase 3: Learning Loop** (Priority: Medium)
- Connect ReasoningBank for decision storage
- Implement semantic search for past decisions
- Add cost-optimization routing via Multi-Model Router

**Phase 4: Cost Visibility** (Priority: Medium)
- Integrate claudelytics reporting
- Real-time cost dashboards
- Budget alerts and optimization suggestions

**Phase 5: Observable UI** (Priority: Medium)
- Show Council responses in real-time tabs (per llm-council)
- Highlight disagreement zones
- Surface uncertainty metrics and model confidence

### Documentation

**For detailed component breakdown, see:**
- [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) - Complete integration guide
  - How llm-council powers multi-model deliberation
  - How claudelytics enables cost transparency
  - How agentic-flow provides execution and learning
  - Data flow between all components
  - Code reuse analysis for each project

**For original design vision, see:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Original architectural design

---

## Who This Is For

You probably want this if:
- You have API keys for multiple frontier models and are willing to pay for quality
- You'd rather understand a decision than receive a recommendation
- You've noticed that different models give usefully different answers to the same question
- You're suspicious of tools that hide their reasoning

You probably don't want this if:
- You want a magic button that just works
- You prefer single-model simplicity
- You trust AI outputs without inspection

---

## The Name

Janus: Roman god of doorways, beginnings, transitions. Two faces—one looking back, one looking forward. 

Also: the two faces represent multiple perspectives on the same reality. Different views, same underlying truth. That's more or less what multi-model deliberation gives you.

---

## License

MIT. Do what you want with it.

---

<p align="center">
  <em>"The map is not the territory, but three maps from different cartographers <br>gives you a better sense of where the territory actually is."</em>
</p>
