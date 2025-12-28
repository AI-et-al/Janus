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
  <a href="#the-problem">The Problem</a> ΓÇó
  <a href="#architecture">Architecture</a> ΓÇó
  <a href="#components">Components</a> ΓÇó
  <a href="#installation">Installation</a> ΓÇó
  <a href="#configuration">Configuration</a> ΓÇó
  <a href="#usage">Usage</a> ΓÇó
  <a href="#api-reference">API Reference</a>
</p>

---

## The Problem

Contemporary LLM agents suffer from a fundamental limitation: **context amnesia**.

Each session starts from zero. The insights discovered at 2 AM vanish by morning. The architectural decisions debated across three conversations exist only in scattered chat logs. The bug you fixed last week? The agent doesn't remember fixing it. The library you decided against using? It'll suggest it again tomorrow. The institutional knowledge that makes human teams effectiveΓÇöthe accumulated understanding of "how we do things here"ΓÇösimply doesn't transfer.

This isn't a minor inconvenience. It's a structural barrier to genuine AI-augmented software engineering.

Consider what happens when you ask an AI assistant to help with a complex codebase:

1. **Session 1**: You explain the architecture. The agent understands. You make progress.
2. **Session 2**: New context window. You explain the architecture again. From scratch.
3. **Session 3**: You've now spent more time re-explaining than building.

The cognitive overhead of context reconstruction dominates actual productive work. And it gets worse: the agent can't learn from its mistakes. Every session, it has the same blind spots, makes the same suggestions you've already rejected, proposes the same patterns that don't fit your codebase.

**Janus exists to solve this.**

Named after the Roman god who simultaneously perceives past and future, Janus orchestrates multiple AI models while maintaining persistent memory across sessions, instances, and contexts. It looks backwardΓÇölearning from every interaction, preserving decisions and their rationalesΓÇöwhile looking forwardΓÇörouting each task to the optimal model based on capability, cost, and current context.

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

When you ask three frontier models the same architectural question, they often disagree. Most systems hide thisΓÇöthey pick one answer or try to synthesize a false consensus.

Janus surfaces disagreement explicitly:

```
Query: Should we use a monorepo or polyrepo for the microservices?

Claude Opus 4.5: Monorepo. Atomic commits across services, unified
  CI/CD, easier refactoring. The tooling has matured (Nx, Turborepo).

GPT-5.2: Polyrepo. Independent deployment cycles, clearer ownership
  boundaries, simpler CI per service. Monorepo tooling adds complexity.

Gemini 3: Depends on team size. <10 engineers ΓåÆ monorepo. >30 ΓåÆ polyrepo.
  You're at 15, so either works. I'd lean monorepo for now, migrate later
  if needed.

Chairman synthesis: No consensus. Key factor is team size and deployment
  independence requirements. Recommend documenting current constraints
  and revisiting in 6 months.
```

This is more useful than a confident-sounding wrong answer.

### 4. Swarm Coordination

For tasks requiring parallel workΓÇöresearching multiple approaches, validating across different contexts, exploring a codebaseΓÇöJanus coordinates agent swarms:

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

Consensus-seeking algorithms that paper over genuine uncertainty are epistemically dishonest. When frontier models disagree on non-trivial problemsΓÇöand they do, frequentlyΓÇöthat disagreement contains information.

Janus treats disagreement as signal, not noise:
- Disagreements are logged with full reasoning from each model
- The chairman model synthesizes but doesn't suppress minority opinions
- Users can query historical disagreements to understand evolving consensus

### Memory as Infrastructure

Cross-session memory isn't a feature bolted on at the end. It's foundational infrastructure that shapes every other design decision.

This means:
- Memory operations are first-class, not afterthoughts
- The schema supports rich queries (by date, by file, by concept, by decision type)
- Memory is append-only with full historyΓÇönothing is silently forgotten
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
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                            JANUS ORCHESTRATOR                                Γöé
Γöé                                                                             Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ Γöé
Γöé  Γöé                     MEMORY LAYER (claude-mem)                          Γöé Γöé
Γöé  Γöé                                                                        Γöé Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé Γöé
Γöé  Γöé  Γöé Observation Γöé  Γöé   Session   Γöé  Γöé   Search    Γöé  Γöé  Timeline   Γöé  Γöé Γöé
Γöé  Γöé  Γöé   Store     Γöé  Γöé   Manager   Γöé  Γöé   Index     Γöé  Γöé  Navigator  Γöé  Γöé Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé Γöé
Γöé  Γöé                           Γöé                                           Γöé Γöé
Γöé  Γöé                    ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ                                   Γöé Γöé
Γöé  Γöé                    Γöé   SQLite    Γöé                                   Γöé Γöé
Γöé  Γöé                    Γöé  Database   Γöé                                   Γöé Γöé
Γöé  Γöé                    ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ                                   Γöé Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ Γöé
Γöé                                                                             Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé
Γöé  Γöé    LLM Council      Γöé  Γöé    Model Router     Γöé  Γöé  janus-dashboard   Γöé  Γöé
Γöé  Γöé                     Γöé  Γöé                     Γöé  Γöé                    Γöé  Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ Γöé  Γöé
Γöé  Γöé  Γöé Claude Opus   Γöé  Γöé  Γöé  Γöé Cost Tracker  Γöé  Γöé  Γöé  Γöé Agent Status Γöé Γöé  Γöé
Γöé  Γöé  Γöé GPT-5.2       Γöé  Γöé  Γöé  Γöé Capability    Γöé  Γöé  Γöé  Γöé Memory View  Γöé Γöé  Γöé
Γöé  Γöé  Γöé Gemini 3      Γöé  Γöé  Γöé  Γöé Matcher       Γöé  Γöé  Γöé  Γöé SSE Stream   Γöé Γöé  Γöé
Γöé  Γöé  Γöé GLM 4.7       Γöé  Γöé  Γöé  Γöé Fallback      Γöé  Γöé  Γöé  Γöé Cmd Palette  Γöé Γöé  Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé  Γöé  Γöé Chains        Γöé  Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ Γöé  Γöé
Γöé  Γöé         Γöé          Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé  Γöé         Γöé          Γöé  Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ   Γöé  Γöé         Γöé          Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ   Γöé  Γöé
Γöé  Γöé  Γöé  Chairman   Γöé   Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ   Γöé  Γöé  Γöé GlassmorphicΓöé   Γöé  Γöé
Γöé  Γöé  Γöé  (Gemini 3  Γöé   Γöé  Γöé  Γöé  LiteLLM    Γöé   Γöé  Γöé  Γöé     UI      Γöé   Γöé  Γöé
Γöé  Γöé  Γöé    Pro)     Γöé   Γöé  Γöé  Γöé   Proxy     Γöé   Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ   Γöé  Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ   Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ   Γöé  Γöé                    Γöé  Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé
Γöé                                                                             Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ Γöé
Γöé  Γöé                         ROUTING LAYER                                  Γöé Γöé
Γöé  Γöé                                                                        Γöé Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé Γöé
Γöé  Γöé  Γöé OpenRouter  Γöé  Γöé  LiteLLM    Γöé  Γöé Oh My       Γöé  Γöé  Direct     Γöé  Γöé Γöé
Γöé  Γöé  Γöé (primary)   Γöé  Γöé  (local)    Γöé  Γöé OpenCode    Γöé  Γöé  API calls  Γöé  Γöé Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ Γöé
Γöé                                                                             Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ Γöé
Γöé  Γöé                          SWARM LAYER                                   Γöé Γöé
Γöé  Γöé                                                                        Γöé Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ    Γöé Γöé
Γöé  Γöé  Γöé   Scout Swarm    Γöé  Γöé  Executor Swarm  Γöé  Γöé  Council Swarm   Γöé    Γöé Γöé
Γöé  Γöé  Γöé                  Γöé  Γöé                  Γöé  Γöé                  Γöé    Γöé Γöé
Γöé  Γöé  Γöé ΓÇó Parallel       Γöé  Γöé ΓÇó Coordinated    Γöé  Γöé ΓÇó Multi-model    Γöé    Γöé Γöé
Γöé  Γöé  Γöé   research       Γöé  Γöé   code changes   Γöé  Γöé   deliberation   Γöé    Γöé Γöé
Γöé  Γöé  Γöé ΓÇó URL verify     Γöé  Γöé ΓÇó File sync      Γöé  Γöé ΓÇó Disagreement   Γöé    Γöé Γöé
Γöé  Γöé  Γöé ΓÇó Doc search     Γöé  Γöé ΓÇó Test runner    Γöé  Γöé   preservation   Γöé    Γöé Γöé
Γöé  Γöé  Γöé ΓÇó Package check  Γöé  Γöé ΓÇó Build verify   Γöé  Γöé ΓÇó Chairman       Γöé    Γöé Γöé
Γöé  Γöé  Γöé                  Γöé  Γöé                  Γöé  Γöé   synthesis      Γöé    Γöé Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ    Γöé Γöé
Γöé  Γöé                                                                        Γöé Γöé
Γöé  Γöé  Transport: QUIC (agentic-flow) / HTTP fallback                       Γöé Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ Γöé
Γöé                                                                             Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ Γöé
Γöé  Γöé                       ANALYTICS LAYER                                  Γöé Γöé
Γöé  Γöé                                                                        Γöé Γöé
Γöé  Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  Γöé Γöé
Γöé  Γöé  Γöé claudelyticsΓöé  Γöé   Token     Γöé  Γöé    Cost     Γöé  Γöé  Pattern    Γöé  Γöé Γöé
Γöé  Γöé  Γöé   (core)    Γöé  Γöé  Counter    Γöé  Γöé  Optimizer  Γöé  Γöé  Detector   Γöé  Γöé Γöé
Γöé  Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  Γöé Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ Γöé
Γöé                                                                             Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

### Data Flow

1. **User query arrives** ΓåÆ Orchestrator receives request
2. **Memory consulted** ΓåÆ Relevant past observations, decisions, context loaded
3. **Route determined** ΓåÆ Model selected based on task type, cost constraints, capability match
4. **Execution** ΓåÆ Single model call OR council deliberation OR swarm deployment
5. **Response generated** ΓåÆ Answer synthesized, disagreements preserved if applicable
6. **Memory updated** ΓåÆ Significant observations, decisions, insights captured
7. **Analytics logged** ΓåÆ Tokens, cost, timing, patterns recorded

---

## Components

### claude-mem ΓÇö Persistent Cross-Session Memory

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

**Status:** Γ£à Production ΓÇö Currently providing memory for active Claude Code sessions

**Location:** `claude-mem/`

---

### llm-council-agent ΓÇö Multi-Model Deliberation

When a decision matters, don't ask one modelΓÇöconvene a council.

**How it works:**

1. **Query submitted** to council with system context
2. **Each model responds** independently (Claude, GPT-5.2, Gemini, GLM)
3. **Chairman reviews** all responses, identifies agreements and disagreements
4. **Synthesis produced** preserving minority opinions and uncertainty
5. **Result stored** in memory with full deliberation trace

**Council composition (default):**
- Claude Opus 4.5 ΓÇö Deep reasoning, nuanced analysis
- GPT-5.2 ΓÇö Broad knowledge, clear explanations
- Gemini 3 Pro ΓÇö Fast synthesis, practical recommendations
- GLM 4.7 ΓÇö Alternative perspective, strong on code

**Chairman:** Gemini 3 Pro (configurable)

**Usage:**
```bash
cd llm-council-agent-ts
npm install
npm run dev "Should we implement rate limiting at the API gateway or per-service?"
```

**Output example:**
```
ΓòöΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòù
Γòæ                        COUNCIL DELIBERATION                       Γòæ
ΓòáΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòú
Γòæ Query: Rate limiting location                                     Γòæ
Γòæ Duration: 4.2s | Cost: $0.0163 | Models: 4                       Γòæ
ΓòáΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòú
Γòæ                                                                   Γòæ
Γòæ CLAUDE OPUS 4.5:                                                  Γòæ
Γòæ API gateway for global limits, per-service for business logic.   Γòæ
Γòæ Defense in depth. Gateway catches abuse, services enforce        Γòæ
Γòæ domain-specific quotas.                                          Γòæ
Γòæ                                                                   Γòæ
Γòæ GPT-5.2:                                                          Γòæ
Γòæ Start with gateway only. Add per-service when you have evidence  Γòæ
Γòæ you need it. YAGNI. Distributed rate limiting is operationally   Γòæ
Γòæ complex (Redis cluster, race conditions).                        Γòæ
Γòæ                                                                   Γòæ
Γòæ GEMINI 3:                                                         Γòæ
Γòæ Gateway. 90% of rate limiting needs are "don't DDoS me" which    Γòæ
Γòæ the gateway handles. Per-service adds latency on every request.  Γòæ
Γòæ                                                                   Γòæ
Γòæ GLM 4.7:                                                          Γòæ
Γòæ Both, but gateway is the priority. Use token bucket at gateway,  Γòæ
Γòæ sliding window per-service only for premium tier features.       Γòæ
Γòæ                                                                   Γòæ
ΓòáΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòú
Γòæ CHAIRMAN SYNTHESIS:                                               Γòæ
Γòæ                                                                   Γòæ
Γòæ Consensus: API gateway rate limiting is the clear priority.      Γòæ
Γòæ Disagreement: Whether per-service limiting is needed now or      Γòæ
Γòæ should wait for evidence.                                        Γòæ
Γòæ                                                                   Γòæ
Γòæ Recommendation: Implement gateway rate limiting immediately.     Γòæ
Γòæ Defer per-service until you have specific business requirements  Γòæ
Γòæ that gateway limits can't address.                               Γòæ
ΓòÜΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓò¥
```

**Configuration:**

Environment variables in `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
COUNCIL_MODELS=openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro,zhipu/glm-4.7
CHAIRMAN_MODEL=google/gemini-3-pro
```

**Status:** Γ£à Operational ΓÇö Tested with OpenRouter, ~$0.016 per query

**Location:** `llm-council-agent-ts/` (TypeScript), `llm-council-agent-py/` (Python)

---

### janus-dashboard ΓÇö Real-Time Agent Observatory

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

**Status:** Γ£à Active

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

**Status:** Γ£à Integrated as of December 2025

---

### agentic-flow ΓÇö QUIC-Based Swarm Coordination

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

**Status:** ΓÜá∩╕Å Code present, local verification pending

**Location:** `agentic-flow/`

---

### claudelytics ΓÇö Usage Analytics

Token consumption, cost tracking, and usage pattern analysis.

**Tracks:**
- Tokens per session, per model, per task type
- Cost breakdown by provider
- Cache hit rates (prompt caching efficiency)
- Response latencies
- Error rates and retry counts

**Status:** Γ£à Active

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
| Auto | Fallback chain | Gemini ΓåÆ Claude ΓåÆ GPT (in order) |

**Configuration file:** `litellm_config.yaml`

**Starting the proxy:**
```bash
litellm --config litellm_config.yaml --port 4000

# Verify
curl http://localhost:4000/health
```

**Status:** ΓÜá∩╕Å Configuration present, proxy deployment optional

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
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# REQUIRED: At least one provider API key
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

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

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# OPTIONAL: LiteLLM proxy configuration
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

LITELLM_MASTER_KEY=your-admin-key
LITELLM_PORT=4000

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# OPTIONAL: Council configuration
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

COUNCIL_MODELS=openai/gpt-5.2,anthropic/claude-opus-4-5,google/gemini-3-pro
CHAIRMAN_MODEL=google/gemini-3-pro

# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
# OPTIONAL: Cost controls
# ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

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

- Spawn another Claude Code instance in a different terminal ΓåÆ Starts fresh
- Use Oh My OpenCode's sub-agents ΓåÆ They can't access parent's memory
- Run a background agent ΓåÆ Isolated from the main session
- Deploy a swarm ΓåÆ Each agent has no shared memory

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
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ     ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ     ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé Claude Code  ΓöéΓöÇΓöÇΓöÇΓöÇΓû╢Γöé   Memory     ΓöéΓùÇΓöÇΓöÇΓöÇΓöÇΓöé Sub-Agent    Γöé
Γöé  Instance 1  Γöé     Γöé    Proxy     Γöé     Γöé  Instance    Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ     Γöé   (HTTP)     Γöé     ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                     ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                            Γöé
                     ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
                     Γöé    SQLite    Γöé
                     Γöé   Database   Γöé
                     ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
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
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ         ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé Claude Code  ΓöéΓùÇΓöÇΓöÇSSEΓöÇΓöÇΓöÇΓöé   Memory     Γöé
Γöé  Instance 1  Γöé         Γöé  Broadcaster Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ         ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                                Γöé
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ                Γöé
Γöé Claude Code  ΓöéΓùÇΓöÇΓöÇSSEΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
Γöé  Instance 2  Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

**If you've solved this problem, we want to hear from you.**

---

## Repository Structure

```
Janus~/
Γö£ΓöÇΓöÇ claude-mem/                 # Persistent memory system
Γöé   Γö£ΓöÇΓöÇ src/
Γöé   Γöé   Γö£ΓöÇΓöÇ hooks/             # Claude Code hook handlers
Γöé   Γöé   Γö£ΓöÇΓöÇ servers/           # MCP server implementation
Γöé   Γöé   Γö£ΓöÇΓöÇ services/          # Core services (sqlite, worker, sync)
Γöé   Γöé   ΓööΓöÇΓöÇ ui/                # Memory viewer UI
Γöé   ΓööΓöÇΓöÇ scripts/               # Utilities (export, import, debug)
Γöé
Γö£ΓöÇΓöÇ claudelytics/              # Usage analytics
Γöé   Γö£ΓöÇΓöÇ src/
Γöé   ΓööΓöÇΓöÇ dashboard/
Γöé
Γö£ΓöÇΓöÇ llm-council/               # Multi-model deliberation (core library)
Γöé   ΓööΓöÇΓöÇ src/
Γöé
Γö£ΓöÇΓöÇ llm-council-agent-ts/      # TypeScript council agent
Γöé   Γö£ΓöÇΓöÇ src/
Γöé   Γöé   Γö£ΓöÇΓöÇ index.ts          # Entry point
Γöé   Γöé   Γö£ΓöÇΓöÇ council.ts        # Council logic
Γöé   Γöé   ΓööΓöÇΓöÇ models.ts         # Model configuration
Γöé   ΓööΓöÇΓöÇ .env                   # API keys (not committed)
Γöé
Γö£ΓöÇΓöÇ llm-council-agent-py/      # Python council agent
Γöé   Γö£ΓöÇΓöÇ src/
Γöé   ΓööΓöÇΓöÇ pyproject.toml
Γöé
Γö£ΓöÇΓöÇ janus-dashboard/           # Real-time monitoring UI
Γöé   Γö£ΓöÇΓöÇ index.html            # Main dashboard
Γöé   Γö£ΓöÇΓöÇ index-glass.html      # Glassmorphism variant
Γöé   Γö£ΓöÇΓöÇ memory/               # Memory browser
Γöé   ΓööΓöÇΓöÇ notifications/        # Alert system
Γöé
Γö£ΓöÇΓöÇ agentic-flow/              # QUIC swarm coordination (third-party)
Γöé   Γö£ΓöÇΓöÇ agentic-flow/         # Nested package structure
Γöé   Γöé   Γö£ΓöÇΓöÇ src/
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ swarm/       # QUIC coordinator
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ agents/      # Agent implementations
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ transport/   # QUIC transport layer
Γöé   Γöé   ΓööΓöÇΓöÇ examples/        # Usage examples
Γöé   ΓööΓöÇΓöÇ packages/             # Sub-packages
Γöé
Γö£ΓöÇΓöÇ janus-agent-sdk/           # Agent SDK extensions
Γöé
Γö£ΓöÇΓöÇ core/                      # Core Janus orchestrator (WIP)
Γöé
Γö£ΓöÇΓöÇ litellm_config.yaml        # Multi-provider routing config
Γö£ΓöÇΓöÇ JANUS_MASTER_PLAN.md       # Implementation roadmap
Γö£ΓöÇΓöÇ CLAUDE.md                  # Claude Code instructions
ΓööΓöÇΓöÇ README.md                  # This file
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
2. **Note disagreements**: If you disagree with a past decision, record thatΓÇödon't silently override
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

Janus is developed by **[AI et al.](https://github.com/AI-et-al)** ΓÇö a cooperative of humans and AI building tools together.

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
- Γ£à Persistent cross-session memory system (claude-mem) ΓÇö fully operational
- Γ£à SQLite-backed storage with full-text search indexing
- Γ£à MCP server integration exposing memory to Claude Code
- Γ£à Timeline navigation and batch observation retrieval
- Γ£à Session summarization and observation capture hooks
- Γ£à Memory viewer UI with search and filtering

**Multi-Model Council**
- Γ£à LLM Council architecture with 4 frontier models
- Γ£à Chairman synthesis that preserves disagreements
- Γ£à OpenRouter integration for unified provider access
- Γ£à TypeScript and Python implementations
- Γ£à Cost tracking per query (~$0.016 for 4-model deliberation)
- Γ£à Configurable council composition and chairman selection

**Dashboard & Monitoring**
- Γ£à Real-time agent status dashboard with glassmorphism UI
- Γ£à SSE-based live updates without polling
- Γ£à Command palette (Cmd+K) for quick actions
- Γ£à Memory browser integrated into dashboard
- Γ£à Session timeline visualization

**Routing & Configuration**
- Γ£à LiteLLM configuration with tiered model access
- Γ£à OpenRouter integration for multi-provider routing
- Γ£à Fallback chains for automatic failover
- Γ£à Cost tracking and budget controls
- Γ£à Frontier model policy enforcement

**Integrations**
- Γ£à Oh My OpenCode integration for enhanced Claude Code experience
- Γ£à agentic-flow package imported (verification pending)
- Γ£à claudelytics for usage analytics

### In Progress

**Cross-Instance Memory**
- ≡ƒöä Solving the memory sharing problem between Claude instances
- ≡ƒöä Evaluating memory proxy service architecture
- ≡ƒöä Exploring Agent SDK integration for memory access

**Swarm Implementation**
- ≡ƒöä Verifying agentic-flow QUIC transport functionality
- ≡ƒöä Replacing Scout mock with real implementation
- ≡ƒöä Designing Executor swarm coordination

**Dashboard Enhancements**
- ≡ƒöä Council deliberation visualization
- ≡ƒöä Cost analytics graphs
- ≡ƒöä Multi-session comparison view

---

## Roadmap

### Phase 1: Memory Federation

Solve the cross-instance memory problem so that:
- Sub-agents spawned by Oh My OpenCode can access parent session memory
- Multiple Claude Code instances share a unified memory store
- Background agents can read and contribute observations

**Approach under consideration:**
1. Memory Proxy Service ΓÇö HTTP/WebSocket API fronting SQLite
2. Shared MCP Server ΓÇö Run claude-mem as a standalone daemon
3. Agent SDK Plugin ΓÇö Embed memory access in Claude Agent SDK

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

MIT ΓÇö see [LICENSE](./LICENSE)

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








