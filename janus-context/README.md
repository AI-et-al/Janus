# Janus Context Store

This directory contains the persistent context state for the Janus multi-model AI orchestration system.

## Structure

- **sessions/** - Conversation summaries and execution records
- **decisions/** - Architectural decisions and strategic choices
- **state/** - Current focus, delegations, open questions
- **manifesto/** - The Manifesto (rules for all agents)
- **artifacts/** - Generated code, documents, outputs

## Purpose

The Context Bridge synchronizes state between:
1. Strategic layer (Claude.ai + Opus 4.5)
2. Execution layer (Claude Agent SDK)
3. All swarms (Scout, Council, Executor)

This enables persistent memory across sessions and multi-model collaboration.

