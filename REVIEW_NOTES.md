# Code Review Notes - December 25, 2025

## Recent Commits Summary (Dec 19-24)

### 1. Specification & Continuity Documents (PR #11) - Dec 24
- Added `spec.md` - comprehensive specification covering architecture, data models, system flows, requirements, and testing strategy
- Added `CONTINUITY.md` - ledger tracking work state and decisions
- Identifies overlapping type definitions and open architectural questions

### 2. Hello Command & API-keyless Operation (PR #9) - Dec 23
- Added `hello` command to CLI
- Lazy-loads orchestrator so info commands can run without API keys
- Improves developer experience for testing

### 3. README Overhaul - Dec 21-22
- Added animated ASCII Janus head (5.8MB GIF)
- Added "The Problem" / "The Solution" sections
- Added integrated systems and frontier models tables
- Redesigned with visual landing page style

### 4. SSH Server Check (PR #7) - Dec 19
- Still marked as WIP

---

## Items Requiring Follow-up

### High Priority
- [x] **Type reconciliation** - Consolidated into `src/types.ts` (commit 5ee8782)
- [x] **Cost tracking source** - Resolved: ModelRouter for orchestration, claudelytics for Claude Code analytics (see Cost Tracking Architecture section)
- [ ] **Council deliberation strategy** - Define when invoked by default vs on-demand

### Medium Priority
- [ ] **Testing gaps** - Add missing tests for:
  - CLI commands (`src/cli.ts`)
  - Orchestrator (`src/orchestrator.ts`)
  - Model router (`src/model-router.ts`)
  - Git sync integration (`src/context-bridge/sync.ts`)
- [ ] **Verification checklist** - Complete items in `spec.md:153-160`

### Low Priority
- [ ] Complete SSH server work - PR #7 still WIP
- [x] Optimize animated GIF - 1.7MB version deployed to root (reduced from 5.8MB)

---

## Open Questions from Spec

1. ~~How should `src/types.ts` and `src/context-bridge/types.ts` be reconciled long-term?~~ **RESOLVED**: Consolidated into `src/types.ts`
2. ~~Should decision metadata include both `timestamp` and `date`?~~ **RESOLVED**: Yes, both included (date for human-readable, timestamp for ISO8601)
3. What is the minimum viable interface for real swarm execution?
4. ~~Which system will be canonical for cost tracking?~~ **RESOLVED**: See Cost Tracking Architecture below
5. When should Council deliberation be invoked by default vs on-demand?

---

## Cost Tracking Architecture (Research Dec 28, 2025)

### Current State

**Existing Components:**
- `ModelRouter` (Janus) - Real-time budget gating with in-memory tracking
- `litellm_config.yaml` (workspace root) - Already configured with all providers:
  - Anthropic (legacy experiments: Claude Opus, Sonnet, Haiku; not the current strategic layer)
  - OpenAI (GPT-5.2, GPT-5.2-pro, GPT-5.2-instant)
  - Google (Gemini 3, Gemini 3 Flash, Gemini 3 Pro)
  - Z.ai (GLM 4.7)
  - OpenCode
- `claudelytics` (external) - Claude Code session analytics ($200/month MAX tracking)

### Available Solutions Researched

| Tool | Type | Strengths | Weaknesses |
|------|------|-----------|------------|
| **LiteLLM** | Proxy/Gateway | Already configured, unified API, built-in budget tracking | No persistent analytics UI |
| **Langfuse** | Observability | Open source, LiteLLM integration, Daily Metrics API | Requires hosting |
| **Helicone** | Gateway+Analytics | 2-minute integration, 300+ models | SaaS dependency |
| **Claudelytics** | CLI Analytics | Rich TUI, Claude Code specific | Claude only |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JANUS COST TRACKING                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐    ┌───────────────┐    ┌────────────┐  │
│  │  LiteLLM      │───▶│   Langfuse    │───▶│  Janus     │  │
│  │  Proxy        │    │   (optional)  │    │  Dashboard │  │
│  │  (Gateway)    │    │               │    │            │  │
│  └───────────────┘    └───────────────┘    └────────────┘  │
│         │                                                   │
│         ▼                                                   │
│  ┌───────────────┐                                         │
│  │ ModelRouter   │  Real-time budget gating                │
│  │ + CostEntry   │  Persists to context-bridge             │
│  └───────────────┘                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  CLAUDE CODE SPECIFIC (Dave's MAX account)                 │
│  ┌───────────────┐                                         │
│  │  Claudelytics │  Parses ~/.claude/projects/ JSONL       │
│  │  (Rust CLI)   │  5-hour billing blocks, TUI dashboard   │
│  └───────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Plan

**Phase 1: Core (Now)**
1. Integrate claudelytics into Janus dashboard
2. Enhance ModelRouter to persist CostEntry records to context-bridge
3. Add cost summary to CLI (`janus costs` command)

**Phase 2: Multi-Model (Next)**
1. Route all Janus API calls through LiteLLM proxy
2. LiteLLM handles cost calculation per provider
3. ModelRouter consumes LiteLLM cost data

**Phase 3: Observability (Optional)**
1. Enable Langfuse callback in litellm_config.yaml
2. Add Langfuse dashboard link to janus-dashboard
3. Daily Metrics API integration for cost reports

### Decision

**Canonical sources:**
- **Claude Code spend** → Claudelytics (parses actual ~/.claude usage)
- **Janus orchestration spend** → LiteLLM + ModelRouter (real-time tracking)
- **Cross-session analytics** → Langfuse (optional, for detailed traces)
