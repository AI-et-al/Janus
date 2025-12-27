# Janus Memory Architecture

Based on "Memory in the Age of AI Agents" (arXiv:2512.13564)

## Structure

```
memory/
├── episodic/     # Raw session data, auto-expires (7 days)
├── semantic/     # Consolidated learnings, human-approved
└── procedural/   # Reusable workflows, scripts, playbooks
```

## Lifecycle

1. **Formation**: Raw data → `episodic/`
2. **Consolidation**: Weekly review → promote patterns to `semantic/`
3. **Promotion**: Validated patterns → `procedural/`
4. **Decay**: Episodic auto-expires; semantic reviewed quarterly

## Access Control

| Agent Role | Episodic | Semantic | Procedural |
|------------|----------|----------|------------|
| Council    | R/W      | R/W      | R/W        |
| Scout      | Write    | Read     | Read       |
| Executor   | -        | Read     | Read       |

## Files

- `episodic/scout-failures.jsonl` - Append-only scout failure log
- `semantic/gemini-learnings.md` - Consolidated Gemini scout insights
- `procedural/` - Executable playbooks (to be populated)
