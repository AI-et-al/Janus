CONTINUITY.md
— Goal (incl. success criteria):
- Draft spec.md aligned with existing docs/code: sections per user list, requirements, architecture decisions, data models, system flows, testing strategy, open questions, and verification checklist.
- Use README.md/ARCHITECTURE.md/DOCUMENTATION.md terminology.
- Commit changes and open PR via make_pr tool.
— Constraints/Assumptions:
- Follow user instructions and repo docs; no AGENTS.md found.
- Update ledger at start and when goal/state changes.
— Key decisions:
- UNCONFIRMED • Canonical data model source for overlapping types not decided yet.
— State:
- Done: Located core docs and source files (README.md, ARCHITECTURE.md, DOCUMENTATION.md, CONFIGURATION.md, COMPONENT_ARCHITECTURE.md, src/types.ts, src/context-bridge/types.ts, CLI/orchestrator/model-router/context-bridge modules). Drafted spec.md.
- Now: Review changes, commit, and prepare PR via make_pr.
- Next: Provide final summary/testing status.
- open questions (UNCONFIRMED if needed):
  - Which type system should be canonical if differences remain (src/types.ts vs src/context-bridge/types.ts)?
— Working set (files/ids/commands):
- README.md, ARCHITECTURE.md, DOCUMENTATION.md, CONFIGURATION.md, COMPONENT_ARCHITECTURE.md
- src/types.ts, src/context-bridge/types.ts, src/cli.ts, src/orchestrator.ts, src/model-router.ts, src/context-bridge/read.ts, src/context-bridge/write.ts, src/context-bridge/sync.ts
