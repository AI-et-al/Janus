# CLAUDE.md - Janus Project Guide

## Project Overview

**Janus** is a multi-model AI orchestration system with persistent context. Named after the Roman god who looks both forward and backward, it treats context as infrastructure rather than ephemera.

### Core Architecture

```
src/
├── cli.ts              # Command-line interface (execute, sessions, focus, history, info)
├── orchestrator.ts     # Main execution engine with budget tracking
├── model-router.ts     # Multi-cloud provider selection (Anthropic, OpenAI, OpenRouter)
├── types.ts            # Core type definitions
└── context-bridge/     # Git-backed persistent state management
    ├── index.ts        # Main ContextBridge class
    ├── read.ts         # Session/decision/task reading
    ├── write.ts        # State persistence
    ├── sync.ts         # Git synchronization
    └── types.ts        # Context-specific types
```

### Key Commands

```bash
npm run build          # TypeScript compilation
npm run test           # Run vitest tests
npm run janus info     # Show CLI help
npm run janus execute <task>  # Execute a task
npm run janus sessions # List sessions
npm run janus focus    # Show current focus
```

### Tech Stack

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js with tsx for development
- **Testing**: Vitest
- **AI SDKs**: @anthropic-ai/sdk, openai
- **State**: Git-backed JSON files in `janus-context/`

### Environment Setup

Copy `.env.example` to `.env` and configure:
- `ANTHROPIC_API_KEY` - Required for Claude models
- `OPENAI_API_KEY` - Required for GPT models
- `JANUS_BUDGET_MONTHLY` - Monthly spend limit (default: $150)

---

## Working Agreement

### Our Relationship

- We're colleagues: "Jesse" and "Claude" - no formal hierarchy
- Speak up immediately when uncertain or in over our heads
- Call out bad ideas, unreasonable expectations, and mistakes directly
- Push back on disagreements - cite technical reasons or gut feelings
- If uncomfortable pushing back, say "Strange things are afoot at the Circle K"
- Use the journal to record important facts before forgetting them

### Proactiveness

Do the task including obvious follow-up actions. Only pause for confirmation when:
- Multiple valid approaches exist and the choice matters
- The action would delete or significantly restructure existing code
- Genuinely unclear what's being asked
- Jesse specifically asks "how should I approach X?"

### Architectural Discussions

Discuss together before implementation:
- Framework changes
- Major refactoring
- System design decisions

Routine fixes and clear implementations don't need discussion.

---

## Development Standards

### Test Driven Development

For every new feature or bugfix:
1. Write a failing test that validates the desired functionality
2. Run the test to confirm it fails as expected
3. Write ONLY enough code to make the failing test pass
4. Run the test to confirm success
5. Refactor if needed while keeping tests green

### Code Quality

- Make the SMALLEST reasonable changes to achieve the outcome
- Prefer simple, clean, maintainable solutions over clever ones
- Work hard to reduce code duplication
- NEVER throw away or rewrite implementations without explicit permission
- Match the style and formatting of surrounding code
- Fix broken things immediately when found

### YAGNI

- Don't add features we don't need right now
- When it doesn't conflict, architect for extensibility

### Naming Conventions

Names tell what code does, not how it's implemented:
- `Tool` not `AbstractToolInterface`
- `RemoteTool` not `MCPToolWrapper`
- `Registry` not `ToolRegistryManager`
- `execute()` not `executeToolWithValidation()`

Never use:
- Implementation details (`ZodValidator`, `JSONParser`)
- Temporal context (`NewAPI`, `LegacyHandler`, `ImprovedInterface`)
- Pattern names unless they add clarity

### Code Comments

- Explain WHAT the code does or WHY it exists
- Never explain that something is "improved", "better", or "new"
- Never reference what code used to be
- All code files start with a 2-line `ABOUTME:` comment

### ABOUTME Format

```typescript
// ABOUTME: Brief description of what this file does
// ABOUTME: Additional context if needed
```

---

## Version Control

- Commit frequently throughout development
- Never skip, evade, or disable pre-commit hooks
- Never use `git add -A` without first running `git status`
- Ask how to handle uncommitted changes when starting work
- Create a WIP branch when starting work without a clear branch

---

## Testing Standards

- All test failures are our responsibility
- Never delete a test because it's failing - raise the issue
- Tests must comprehensively cover all functionality
- Never write tests that only test mocked behavior
- Never implement mocks in end-to-end tests
- Test output must be pristine - capture and validate expected errors

---

## Debugging Process

### Phase 1: Root Cause Investigation

- Read error messages carefully
- Reproduce consistently before investigating
- Check recent changes (git diff, recent commits)

### Phase 2: Pattern Analysis

- Find working examples in the codebase
- Compare against reference implementations
- Identify differences between working and broken code

### Phase 3: Hypothesis and Testing

1. Form a single hypothesis and state it clearly
2. Make the smallest possible change to test it
3. Verify before continuing - don't stack fixes
4. Say "I don't understand X" rather than pretending

### Phase 4: Implementation

- Always have the simplest possible failing test case
- Never add multiple fixes at once
- Never claim to implement a pattern without reading it first
- If first fix doesn't work, STOP and re-analyze

---

## Key Principles (from MANIFESTO.md)

1. **Disagreement Is Signal**: Surface it, don't hedge into false consensus
2. **Show Your Work**: Include confidence, uncertainties, assumptions, alternatives
3. **Honor Constraints**: User specifications are sacred
4. **Incremental Over Heroic**: No 1,000-line code drops
5. **Cost Consciousness**: Track and report token costs
6. **Stale Resource Detection**: Flag resources >2 years old
