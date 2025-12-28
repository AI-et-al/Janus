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
- [ ] **Type reconciliation** - Decide canonical source between `src/types.ts` and `src/context-bridge/types.ts`
- [ ] **Cost tracking source** - Determine if ModelRouter or claudelytics is canonical
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

1. How should `src/types.ts` and `src/context-bridge/types.ts` be reconciled long-term?
2. Should decision metadata include both `timestamp` and `date`?
3. What is the minimum viable interface for real swarm execution?
4. Which system will be canonical for cost tracking?
5. When should Council deliberation be invoked by default vs on-demand?
