# Janus Configuration - Week 1 Implementation

**Status:** Locked configuration for Week 1-5 implementation
**Date:** December 18, 2025
**Configuration Version:** 1.0

## User-Approved Configuration Decisions

### 1. API Provider Strategy: Multi-Cloud
- **Selected:** Anthropic + OpenAI + OpenRouter
- **Rationale:** Maximum flexibility and cost optimization
- **Implementation:**
  - Use agentic-flow's `ModelRouter` for intelligent provider selection
  - Primary: Anthropic Claude (quality)
  - Secondary: OpenAI GPT (speed)
  - Tertiary: OpenRouter (cost optimization, 85-99% savings possible)
  - Automatic failover and cost-aware routing enabled
- **Configuration Keys:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`

### 2. Monthly Budget: $100-150
- **Selected:** $100-150/month (Recommended tier)
- **Task Capacity:** 1000-2000 tasks/month
- **Characteristics:**
  - Balanced quality/cost trade-off
  - Suitable for foundation phase (Weeks 1-4) and early production testing (Week 5)
  - Allows premium model usage with strategic routing
- **Budget Enforcement:** Automatic spend tracking with `$150/month hard limit`
- **Tracking:** Cost logged per operation, per model, per session

### 3. Agent Model Assignment: Default Tier
- **Scout Swarm:** Haiku (fast, cheap research)
- **Council Swarm:** Sonnet (balanced deliberation)
- **Executor Swarm:** Sonnet (balanced execution with quality)
- **Strategic Layer (Opus.ai):** Opus 4.5 (human interaction, architecture decisions)
- **Rationale:** Optimal for $100-150 budget; Sonnet provides quality execution while Haiku keeps research costs low

### 4. Claude-OS Backend: Anthropic
- **Selected:** Anthropic backend (unified with primary API provider)
- **Characteristics:**
  - Highest quality code learning and indexing
  - ~$20-40/month additional cost (included in $100-150 budget)
  - Fast indexing (comparable to OpenAI backend)
  - Integrated with main Anthropic API key
- **Purpose:** Real-time learning from codebase patterns, executed task analysis, knowledge base building
- **Alternative:** Local Ollama available if privacy/cost becomes critical priority

### 5. Deployment Target: Local Development
- **Selected:** Local Docker deployment on development machine
- **Characteristics:**
  - Full control over execution
  - Zero cloud infrastructure costs
  - Suitable for Weeks 1-4 (foundation and swarm implementation)
  - Week 5 will assess cloud migration needs
- **Docker Support:** Docker Compose configuration provided; can scale to cloud via same Docker image

### 6. Observability & Logging: Detailed
- **Selected:** Detailed logging across all operations
- **Includes:**
  - Core operations (create session, delegate task, record decision)
  - All errors and warnings
  - Performance metrics (latency per operation, task completion time)
  - Task results and status updates
  - Model selection traces (which provider chose which model, why)
  - Cost per operation (inputs, outputs, estimated USD cost)
  - Decision reasoning and alternatives considered
- **Logging Format:** Structured JSON with timestamps
- **Output:** Console + file logs in `logs/` directory
- **Cost Impact:** Minimal (detailed logging is non-API overhead)

### 7. Testing Strategy: Unit + Integration
- **Selected:** Unit tests + Integration tests (recommended balance)
- **Test Coverage:**
  - Context Bridge read/write operations
  - Session and decision persistence
  - Git sync operations
  - CLI command execution
  - Task delegation and status updates
  - ModelRouter provider selection logic
  - Cost tracking accuracy
- **Test Framework:** Vitest (fast, ESM-native)
- **Timeline Impact:** ~2 additional days in Week 1 for comprehensive tests
- **CI/CD:** Github Actions for pre-commit testing

### 8. Cost Optimization: Automatic
- **Selected:** Automatic smart routing and model selection
- **Features:**
  - Intelligent provider selection based on:
    - Task complexity (simple → Haiku, complex → Sonnet/Opus)
    - Response time requirements (slow acceptable → OpenRouter, fast required → Anthropic/OpenAI)
    - Budget remaining (high budget → quality-first, low budget → cost-first)
  - Automatic fallback if primary provider unavailable
  - Per-operation cost estimation before execution
  - Monthly budget enforcement (hard limit at $150)
  - Weekly spend reports to CLI
  - Cost-benefit analysis for multi-cloud switching
- **Admin Controls:** Can override routing with manual provider specification
- **Transparency:** All routing decisions logged with reasoning

### 9. Repository Structure: Git Submodules
- **Context Store:** `janus-context/` (already initialized as separate git repo)
- **Main Repository:** `Janus/` (main application code)
- **External Dependencies:** Git submodules for:
  - `agentic-flow` (orchestration engine)
  - `llm-council` (deliberation protocol)
  - `claude-os` (code learning)
  - `claudelytics` (cost tracking)
- **Rationale:** Separate versioning enables janus-context to sync independently while maintaining sync with external libraries

### 10. API Key Management
- **Method:** Environment variables via `.env` file
- **Required Keys:**
  - `ANTHROPIC_API_KEY` (required immediately)
  - `OPENAI_API_KEY` (optional, recommended for Week 2+)
  - `OPENROUTER_API_KEY` (optional, recommended for cost optimization)
  - `GITHUB_TOKEN` (for remote sync capability)
- **Security:** `.env` is `.gitignore`'d, never committed
- **Fallback:** Application works with Anthropic-only until keys provided

## Configuration Files

### Environment (.env)
```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
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

### TypeScript Configuration (tsconfig.json)
- Target: ES2022
- Module: ESNext
- Module Resolution: node
- Strict mode: enabled

## Implementation Timeline

### Week 1: Foundation (Current Phase)
- ✅ Context Bridge TypeScript modules (read, write, sync)
- ✅ CLI with 5 commands (execute, sessions, focus, history, info)
- 🔄 Tests for Context Bridge
- 🔄 JanusOrchestrator skeleton
- 🔄 Build system and initial deployment

### Week 2: Swarms
- Scout Swarm (parallel research via agentic-flow federation)
- Council Swarm (3-stage deliberation via llm-council)
- Executor Swarm (code execution via Agent Booster)

### Week 3: Memory Integration
- Claude-OS learning system integration
- ReasoningBank pattern optimization
- Cross-layer context sync

### Week 4: Analytics
- Claudelytics cost tracking
- Performance monitoring
- Budget forecasting

### Week 5: Optimization
- Learned model selection
- Auto-topology selection
- Performance tuning based on metrics

## Success Metrics

### Week 1 Foundation
- Context Bridge achieves 95%+ success rate on CRUD operations
- CLI responds to all commands without errors
- Tests pass at 90%+ coverage
- Project builds and runs locally

### Budget Compliance
- Actual spend stays within $150/month budget (target: $80-120/month)
- Per-task cost averages $0.05-0.15 with multi-cloud routing
- Cost visibility in all CLI outputs

### Quality Standards
- No unhandled exceptions
- All API errors logged with context
- Decision reasoning captured for audit
- Performance metrics tracked for optimization

## Notes

- This configuration is flexible and can be adjusted in Week 2+ based on actual usage patterns
- Cost optimization is conservative (prioritizes safety over savings initially)
- Detailed logging will help identify optimization opportunities
- Each week's deliverables can adjust configuration based on learnings
- Configuration is stored in this file and enforced via environment variables

---

**Last Updated:** December 18, 2025
**Next Review:** End of Week 1 (December 24, 2025)
