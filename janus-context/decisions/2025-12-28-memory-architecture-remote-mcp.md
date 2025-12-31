# Memory architecture: Remote MCP for cross-device sync

**Date:** 2025-12-28
**Timestamp:** 2025-12-28T22:18:36Z
**Made By:** human
**Confidence:** 80%
**Reversible:** true

## Decision

Adopt a thin, self-hosted Remote Memory MCP as the shared memory plane across devices and models. Keep claude-mem and janus-context as sources of truth. Treat mem0/OpenMemory and Basic Memory Cloud as optional backends (fallbacks), and continue using OpenRouter purely as a stateless router with prompt caching.

## Rationale

- Claude sessions already persist via claude-mem, but memory isn’t shared across devices/models.
- OpenCode and Gemini both support remote MCP servers; a single MCP surface unifies access without vendor lock-in.
- The MCP can read/write janus-context (decisions/sessions/focus) and claude-mem (SQLite) behind one API, enabling real-time sync and auditability.
- OpenRouter is stateless; context must be fetched/injected per request—best handled by the MCP.

## Alternatives Considered

- Make mem0 the core memory layer now — rejected: claude-mem already works; mem0 remains optional for later.
- Use Basic Memory Cloud — rejected for now due to recurring cost; keep as a managed fallback if remote MCP needs to be turnkey.
- Do nothing — rejected: cross-device continuity remains manual and error-prone.

## Pilot Success Criteria

- S1: A decision added on Device A is visible to Gemini on Device B within 10 seconds.
- S2: A new Claude observation is searchable by Gemini/OpenCode within 10 seconds.
- S3: Orchestrated calls auto-inject ≥3 relevant memory items with no manual paste.
- S4: No data loss after restarts; changes reflected in janus-context git history.

## Next Steps

1) Implement Remote Memory MCP (WS) with two adapters: janus-context (files) and claude-mem (SQLite).
2) Configure OpenCode and Gemini CLI to point at the MCP.
3) Update the Orchestrator to fetch/inject context from MCP before model calls.
4) Verify S1–S4 and document results.
