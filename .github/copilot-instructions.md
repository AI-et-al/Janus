# Copilot Instructions for Janus

## Project Overview

Janus is a multi-model AI orchestration system that routes tasks across multiple language model providers (Anthropic, OpenAI, OpenRouter), maintains persistent context across sessions via a git-backed state store, and executes work through coordinated agent swarms with observable cost tracking.

The system is named after the Roman god Janus, who possessed two faces looking in opposite directions. The multiple "faces" represent different LLM perspectives on the same problem, and the valuable signal emerges from where these perspectives **disagree**.

## Architecture

### Core Components

1. **Context Bridge** (`src/context-bridge/`): Git-backed persistent state management for sessions, decisions, and tasks
2. **Model Router** (`src/model-router.ts`): Intelligent multi-cloud provider selection with cost optimization
3. **Orchestrator** (`src/orchestrator.ts`): Main execution engine coordinating all components
4. **CLI Interface** (`src/cli.ts`): Command-line access to the orchestration system

### Technology Stack

- **Language**: TypeScript (ES2022, ESNext modules)
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Test Framework**: Vitest
- **Build Tool**: TypeScript Compiler (tsc)
- **Module System**: ES Modules (type: "module" in package.json)

## Development Setup

### Prerequisites

- Node.js 18+
- Git
- API keys for at least one provider (Anthropic recommended)

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (recommended for multi-cloud)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
GITHUB_TOKEN=ghp_...

# Janus Configuration
JANUS_CONTEXT_PATH=./janus-context
JANUS_LOG_LEVEL=debug
JANUS_BUDGET_MONTHLY=150
JANUS_AUTO_SYNC=true

# Feature Flags
ENABLE_COST_OPTIMIZATION=true
ENABLE_DETAILED_LOGGING=true
ENABLE_MANIFESTO_INJECTION=true
```

### Build and Run

```bash
# Build
npm run build

# Run in development
npm run dev <command>

# Run tests
npm test

# Clean build artifacts
npm run clean
```

## Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All strict TypeScript checks are enforced
- **No implicit any**: Always specify types explicitly
- **ES Modules**: Use `import/export` syntax (not `require`)
- **File extensions**: Use `.js` extensions in imports (ESM requirement)

### Naming Conventions

- **Files**: kebab-case (e.g., `model-router.ts`, `context-bridge/`)
- **Classes**: PascalCase (e.g., `JanusOrchestrator`, `ContextBridge`)
- **Interfaces**: PascalCase (e.g., `Session`, `Decision`, `Task`)
- **Functions**: camelCase (e.g., `loadSession`, `routeRequest`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MODEL_CONFIGS`)

### Code Organization

- **Interfaces and types**: Define in dedicated `types.ts` files
- **Single Responsibility**: Each module should have one clear purpose
- **Async/Await**: Use async/await over raw promises
- **Error Handling**: Always handle errors with proper logging

### Comments

- Avoid obvious comments
- Use JSDoc for public APIs
- Explain complex logic or non-obvious decisions
- Reference external resources with working URLs

## Core Principles (from MANIFESTO.md)

When contributing to Janus, adhere to these principles:

### 1. Disagreement Is Signal
- Surface disagreements explicitly rather than synthesizing them away
- When models disagree, that delta is valuable information

### 2. Show Your Work
Every proposal must include:
- Confidence level (0-100%)
- Uncertainties (what you're not sure about)
- Assumptions (what you're taking as given)
- Alternatives considered (what was rejected and why)

### 3. Honor Constraints
- Treat user constraints as sacred
- "Must use OAuth 2.0" means OAuth 2.0, not alternatives
- Constraints encode decisions made with context the model cannot see

### 4. Incremental Over Heroic
Following the Karpathy Principle:
- No 1,000-line code drops
- Each step explained before execution
- Human approval at every significant decision
- Work in chunks humans can hold in their heads

### 5. Draconian Scout Protocol
When referencing external resources, **verify**:
- Libraries/Packages: Must provide working install command
- APIs/Services: Documentation URL must be valid
- Tools/Frameworks: Must exist and be maintained
- **No speculation, no hallucination**

### 6. Cost Consciousness
- Every operation has a cost - track and report it
- Token counts per response
- Running total per session
- Cost per model (they differ significantly)

## Testing Requirements

### Test Framework
- **Vitest**: Fast, ESM-native testing
- **Location**: Tests live alongside code in `__tests__/` directories or as `.test.ts` files
- **Coverage Target**: 90%+ for new code

### Test Categories
1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **Mock External APIs**: Don't make real API calls in tests

### Running Tests
```bash
npm test           # Run all tests
npm test -- --watch  # Watch mode
```

## Key Files and Directories

```
janus/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── orchestrator.ts           # Main orchestration engine
│   ├── model-router.ts           # Multi-cloud provider routing
│   ├── types.ts                  # Shared TypeScript types
│   └── context-bridge/
│       ├── index.ts              # ContextBridge class
│       ├── types.ts              # Context types
│       ├── read.ts               # Read operations
│       ├── write.ts              # Write operations
│       └── sync.ts               # Git synchronization
├── janus-context/                # Git-backed state store (separate repo)
│   ├── sessions/                 # Session JSON files
│   ├── decisions/                # Decision markdown files
│   └── state/
│       ├── current-focus.json    # Current focus state
│       └── delegations/          # Delegated task files
├── dist/                         # Compiled output
├── MANIFESTO.md                  # Core principles
├── CONFIGURATION.md              # Configuration documentation
├── README.md                     # Project documentation
├── package.json
└── tsconfig.json
```

## Important Configuration Details

### Model Assignment (from CONFIGURATION.md)
- **Scout Swarm**: Haiku (fast, cheap research)
- **Council Swarm**: Sonnet (balanced deliberation)
- **Executor Swarm**: Sonnet (quality execution)
- **Strategic Layer**: Opus 4.5 (human interaction, architecture)

### Budget Management
- **Default Monthly Budget**: $100-150 (configurable)
- **Automatic Enforcement**: Hard limit at configured budget
- **Cost Tracking**: Per operation, per model, per session
- **Smart Routing**: Automatic downgrade to cheaper models when budget constrained

### Multi-Cloud Routing
- **Primary**: Anthropic Claude (quality)
- **Secondary**: OpenAI GPT (speed)
- **Tertiary**: OpenRouter (cost optimization, 85-99% savings)
- **Automatic Failover**: Built-in provider fallback

## Common Tasks

### Adding a New Feature
1. Review MANIFESTO.md for principles
2. Check CONFIGURATION.md for locked decisions
3. Write tests first (TDD encouraged)
4. Implement with minimal changes
5. Run tests and build
6. Update relevant documentation

### Modifying Context Bridge
- All changes must maintain backward compatibility
- JSON schema changes require migration plan
- Git operations should be atomic
- Test git sync thoroughly

### Adding a New Model Provider
- Update `MODEL_CONFIGS` in `model-router.ts`
- Add cost metrics (per million tokens)
- Implement client initialization
- Add routing logic
- Update CONFIGURATION.md

### CLI Commands
- Keep commands simple and focused
- Provide helpful error messages
- Log operations for debugging
- Follow existing command patterns

## Security Considerations

- **API Keys**: Never commit API keys to git
- **Environment Variables**: Use `.env` file (git-ignored)
- **Secrets in Logs**: Sanitize sensitive data before logging
- **Git Context**: Ensure no sensitive data in context store

## Documentation

- **README.md**: User-facing documentation
- **MANIFESTO.md**: Core principles and agent behavior
- **CONFIGURATION.md**: Locked configuration decisions
- **COMPONENT_ARCHITECTURE.md**: Integration details
- **ARCHITECTURE.md**: System architecture details

When making changes that affect user interaction, update the relevant documentation.

## Git Workflow

- **Branch Naming**: Use descriptive names (e.g., `feature/add-cost-tracking`)
- **Commits**: Clear, descriptive commit messages
- **Context Store**: The `janus-context/` directory is a separate git repo
- **Sync**: Context changes are committed and pushed automatically when `JANUS_AUTO_SYNC=true`

## Integration Points

### External Projects (as documented in COMPONENT_ARCHITECTURE.md)
1. **llm-council**: Multi-model deliberation engine
2. **claudelytics**: Cost tracking and analytics
3. **agentic-flow**: Agent framework and learning systems
4. **Claude Agent SDK**: Subagent coordination

These are integrated via git submodules or npm packages.

## Performance Considerations

- **Token Efficiency**: Minimize unnecessary context in prompts
- **Parallel Operations**: Scouts can run in parallel (typical: 5 scouts)
- **Caching**: Consider caching expensive operations
- **Cost vs Quality**: Balance model selection based on task complexity

## Debugging

### Logging
- Set `JANUS_LOG_LEVEL=debug` for detailed logs
- Logs include: operations, errors, performance metrics, costs
- Format: Structured JSON with timestamps
- Output: Console + file logs in `logs/` directory

### Common Issues
- **Build errors**: Check TypeScript version and `tsconfig.json`
- **Module resolution**: Ensure `.js` extensions in imports
- **API errors**: Verify API keys in `.env`
- **Git sync failures**: Check git configuration and permissions

## Current Status (Week 1 Foundation)

✅ Completed:
- Context Bridge (read, write, sync)
- CLI with 5 commands (execute, sessions, focus, history, info)
- Model Router (multi-cloud routing)
- Orchestrator (session + plan execution)

🔄 In Progress:
- Unit tests (target: 90%+ coverage)
- Integration tests
- Build system refinement

📋 Planned (Weeks 2-5):
- Week 2: Swarms (Scout, Council, Executor)
- Week 3: Memory Integration (Claude-OS)
- Week 4: Analytics (Claudelytics)
- Week 5: Optimization

## Questions or Issues?

Refer to:
1. **README.md** for high-level overview
2. **MANIFESTO.md** for core principles
3. **CONFIGURATION.md** for configuration decisions
4. **GitHub Issues** for known issues and feature requests
