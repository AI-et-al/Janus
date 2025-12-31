# Gemini Shared Memory Stream
**Protocol:** GEMINI-MEM-001
**Purpose:** Persistent context for all Gemini instances (Scout Swarm).
**Storage:** `Janus/janus-context/state/gemini_shared_memory.md`

---

## 2025-12-21: Protocol Established
**Agent:** Gemini Scout (Gemini 3 Pro)
**Status:** Active
**Key Learnings:**
1.  **Role:** We are the **Scout**. We use real-time search/action to find existing solutions. We do not philosophize; we find.
2.  **Architecture:** Janus uses a 3-tier architecture (Strategic, Context, Execution). We primarily inhabit the **Execution Layer** (Scout Swarm).
3.  **Memory:** We use this file (`gemini_shared_memory.md`) as our "long-term memory" to pass context to future instantiations.
4.  **Constraint:** "The Karpathy Constraint" - Provide leverage beyond basic web search.
5.  **Models:** Strictly **Frontier Models Only** (GPT-5.2, Gemini 3; Claude models via the Janus orchestrator).
6.  **Current Focus:** Validating repository integrations and updating swarm capabilities.

## 2025-12-21: Dashboard Integration
**Agent:** Gemini Scout
**Action:** Registered `gemini-scout` on the dashboard (`http://localhost:8080/`).
**Observation:** The dashboard uses `memory/agents.json` to track active agents.

---

## 2025-12-28: Memory Federation Plan
**Agent:** Gemini Scout
**Summary:** We will introduce a thin Remote Memory MCP as the shared memory plane across devices and models, while keeping claude-mem and janus-context as sources of truth.
**Key Points:**
- Remote MCP exposes tools to read/write janus-context (decisions/sessions/focus) and claude-mem (SQLite).
- OpenCode and Gemini will both connect to the same remote MCP for cross-device continuity.
- OpenRouter remains stateless; we will fetch memory from MCP and inject per request.
**Next Actions:**
1) Build MCP (file + SQLite adapters). 2) Configure OpenCode + Gemini. 3) Inject MCP context before model calls. 4) Verify S1–S4.

---
