# JANUS → GitHub Push Handoff

**For Claude Code execution. Drop this file + the tarball in your working directory.**

---

## Prerequisites Checklist

Before running, ensure:
- [ ] You have GitHub CLI (`gh`) authenticated, OR
- [ ] You have SSH keys configured for git@github.com
- [ ] The repo `AI-et-al/janus` exists (or you want to create it)

---

## Instructions for Claude Code

Execute these steps in order:

### Step 1: Extract the tarball

```bash
cd ~/projects  # or wherever you want it
tar -xzf janus-github-ready.tar.gz
cd janus
```

### Step 2: Initialize Git repository

```bash
git init
git add .
git commit -m "Initial commit: Janus multi-model AI orchestration

Two faces looking in opposite directions—one sees the past, one sees the future.
Multi-model AI Council system for observable deliberation.

- README with vision and architecture overview
- MANIFESTO: Rules enforced on all subagents  
- ARCHITECTURE: Full technical design
- TypeScript project scaffold with types
- Context Bridge directory structure
- Pixelated Janus head art assets"
```

### Step 3: Create remote and push

**Option A: Using GitHub CLI (preferred)**
```bash
# Create repo if it doesn't exist
gh repo create AI-et-al/janus --public --source=. --remote=origin --push

# Or if repo already exists:
git remote add origin https://github.com/AI-et-al/janus.git
git branch -M main
git push -u origin main --force
```

**Option B: Using SSH**
```bash
git remote add origin git@github.com:AI-et-al/janus.git
git branch -M main
git push -u origin main --force
```

### Step 4: Verify

```bash
gh repo view AI-et-al/janus --web
# Or manually: https://github.com/AI-et-al/janus
```

---

## If Repo Already Has Content

If there's existing content you want to replace:

```bash
git push -u origin main --force
```

This overwrites the remote with the new Janus content.

---

## Post-Push: Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY=sk-ant-api03-...
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=AI...

# Test CLI
npx tsx src/cli.ts info
npx tsx src/cli.ts focus
```

---

## Directory Structure After Push

```
janus/
├── README.md              # Vision + Karpathy principles
├── ARCHITECTURE.md        # Full technical design  
├── MANIFESTO.md          # Subagent rules
├── LICENSE               # MIT
├── package.json          # TypeScript project
├── tsconfig.json
├── .env.example          # API key templates (3 providers)
├── .gitignore
│
├── assets/
│   ├── banner.png        # Pixelated Janus, silver on black
│   ├── banner-small.png
│   ├── icon.png
│   └── symposium-reference.jpg
│
├── janus-context/        # Context Bridge (Git-backed state)
│   ├── sessions/
│   ├── decisions/
│   ├── state/
│   │   ├── current-focus.json
│   │   └── delegations/
│   ├── manifesto/MANIFESTO.md
│   └── artifacts/
│
└── src/
    ├── cli.ts            # Entry point
    ├── types.ts          # TypeScript interfaces
    ├── context-bridge/   # TODO
    ├── orchestrator/     # TODO
    ├── swarms/{scout,council,executor}/  # TODO
    ├── providers/        # TODO
    └── utils/            # TODO
```

---

## What's Done vs TODO

| ✅ Done | ⬜ TODO |
|---------|---------|
| README with vision | Context Bridge implementation |
| ARCHITECTURE document | Council deliberation protocol |
| MANIFESTO rules | Claude/GPT/Gemini adapters |
| TypeScript types | Disagreement detection |
| CLI skeleton | Scout swarm |
| Project scaffold | Executor swarm |
| Janus pixel art | Observable UI |
| Context Bridge design | Cost tracking |

---

## API Keys Needed

| Provider | Console URL | Env Variable |
|----------|-------------|--------------|
| Anthropic | https://console.anthropic.com/ | `ANTHROPIC_API_KEY` |
| OpenAI | https://platform.openai.com/api-keys | `OPENAI_API_KEY` |
| Google | https://aistudio.google.com/apikey | `GOOGLE_API_KEY` |

All three are needed for full Council functionality. Claude-only works for scout/executor swarms.

---

## Next Session Focus

After push, the next work session should focus on:

1. **Context Bridge** (`src/context-bridge/`)
   - Read/write to janus-context directory
   - Session management
   - Decision logging

2. **Council Protocol** (`src/swarms/council/`)
   - Parallel API calls to Claude, GPT, Gemini
   - Structured proposal parsing
   - Disagreement detection

The foundation is laid. Build incrementally.
