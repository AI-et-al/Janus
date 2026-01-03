# Janus Context Store

This directory contains the persistent context state for the Janus multi-model AI orchestration system.

## Structure

- **sessions/** - Conversation summaries and execution records
- **decisions/** - Architectural decisions and strategic choices
- **state/** - Current focus, delegations, open questions, model catalog, and ratings
- **state/models.json** - Model catalog (provider order, pricing, base tiers)
- **state/model-ratings.jsonl** - Append-only peer ratings
- **state/model-tiers.json** - Computed tier snapshot (fast/balanced/quality)
- **state/last-model-run.json** - Pointer to the last model run (for rating)
- **manifesto/** - The Manifesto (rules for all agents)
- **artifacts/** - Generated code, documents, outputs

## Purpose

The Context Bridge synchronizes state between:
1. Janus orchestrator (model-agnostic top-level reasoning)
2. Execution layer (Claude Agent SDK)
3. All swarms (Scout, Council, Executor)

This enables persistent memory across sessions and multi-model collaboration.

