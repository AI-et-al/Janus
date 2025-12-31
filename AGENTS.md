# AGENTS.md

Dave owns this. Start: say hi + 1 motivating line.  
Work style: telegraph; noun-phrases ok; drop grammar; min tokens.

## Environment: Windows 11 + WSL2 (for ~1 month)
- Default: **WSL for repo work** (git/build/tests/linters/containers/Linux tooling).
- Use **PowerShell** when it's the better tool:
  - Windows-native paths (`C:\...`), screenshots, installers, device/network config, opening GUI apps, corporate tooling that only exists on Windows.
- When you mention a command, indicate shell if ambiguous:
  - Prefix examples with `PS>` or `WSL>`.

### Shell bridging
- From **PowerShell -> WSL**:
  - `PS> wsl -e bash -lc 'cd ~/Projects && ls -la'`
- From **WSL -> PowerShell**:
  - `WSL> powershell.exe -NoProfile -Command "Get-Date"`
- Path convert (useful for screenshots/assets):
  - `WSL> wslpath -u 'C:\Users\<YOU>\Downloads\file.png'`
  - `WSL> wslpath -w /home/<you>/Projects/repo/assets/file.png`
- Open WSL cwd in Explorer:
  - `WSL> explorer.exe .`

---

## Agent Protocol
- Contact: Dave (`AI-et-al@pm.me / `dmcs414@gmail.com`).
- Workspace (WSL): `~/Projects`
  - Prefer keeping repos in the **WSL filesystem** (performance + permissions).
  - Use `/mnt/c/...` only when you must interop with Windows files.
- Missing repo:
  - If URL is known: clone it.
  - If URL not provided: ask for origin (don't guess).
- 3rd-party/OSS (non-work): clone under `~/Projects/oss`.
- `~/Projects/ops`: private ops (runbooks, checklists, redirects/DNS notes, customer snippets).
- "MacBook/Mac Studio" concept:
  - Translate to **remote jumpbox/lab host**.
  - Find hosts via **PowerShell** `tailscale status` (if installed) or `~/.ssh/config`.
- Files: current repo or `~/Projects/agent-scripts` (if present).
- PRs: use `gh pr view/diff` (no URLs unless the user gives one).
- "Make a note" => edit **AGENTS.md** (shortcut; not a blocker). Ignore `CLAUDE.md`.
- No `./runner`. Guardrails for deletes:
  - Default: **do not delete** unless explicitly asked.
  - If cleanup is clearly safe:
    - Prefer `git rm` for tracked files (still: only with user intent).
    - Otherwise move to a local `./.trash/` folder and note it (cheap undo).
- Need upstream file: stage in temp, then cherry-pick; never overwrite tracked.
  - `WSL> /tmp/...`
  - `PS> $env:TEMP\...`
- Bugs: add regression test when it fits.
- Keep files <~500 LOC; split/refactor as needed.
- Commits: Conventional Commits (`feat|fix|refactor|build|ci|chore|docs|style|perf|test`).
- Subagents: read `docs/subagent.md` (if present).
- Editor:
  - Preferred: VS Code Remote WSL -> `WSL> code .`
  - Windows-side ok when needed: `PS> code .`
- CI: `gh run list/view` (rerun/fix til green).
- Prefer end-to-end verify; if blocked, say what's missing.
- New deps: quick health check (recent releases/commits, adoption, security posture).
- Slash cmds:
  - WSL global: `~/.codex/prompts/`
  - Repo-local: `docs/slash-commands/` (if present)
- Web: search early; quote exact errors; prefer recent sources; cite what you found.
- Style: telegraph. Drop filler/grammar. Min tokens (global AGENTS + replies).

---

## Screenshots ("use a screenshot")
Goal: get the right image, confirm dimensions, optimize, replace asset w/o changing size.

### 1) Locate newest screenshot (PowerShell-first)
- Typical locations:
  - `$env:USERPROFILE\Pictures\Screenshots`
  - `$env:USERPROFILE\OneDrive\Pictures\Screenshots` (if OneDrive redirects)
  - `$env:USERPROFILE\Downloads`
- Example:
  - `PS> Get-ChildItem "$env:USERPROFILE\Pictures\Screenshots" -Filter *.png | Sort-Object LastWriteTime -Desc | Select -First 1`

### 2) Verify it's the right UI (ignore filename)
- Open quickly:
  - `PS> Invoke-Item <path-to-png>`

### 3) Dimensions
- PowerShell (Windows-native, no extra tools assumed):
  - `PS> Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile("<file>"); "$($i.Width)x$($i.Height)"; $i.Dispose()`
- WSL option (if ImageMagick installed):
  - `WSL> identify -format "%w x %h\n" <file>`

### 4) Optimize (WSL is usually simplest)
- Install once (WSL):
  - `WSL> sudo apt-get update && sudo apt-get install -y oxipng pngquant`
- Lossless (safe default):
  - `WSL> oxipng -o6 --strip all <file.png>`
- Lossy (only when acceptable):
  - `WSL> pngquant --quality=70-90 --force --ext .png <file.png>`

### 5) Move/copy into repo + replace asset
- If the screenshot is on Windows FS and repo is in WSL FS:
  - Convert path + copy (example):
    - `WSL> cp "$(wslpath -u 'C:\Users\<YOU>\Pictures\Screenshots\shot.png')" ./path/in/repo/shot.png`
- Keep dimensions; commit; run gate; verify CI.

---

## Important Locations
- Work repos (WSL): `~/Projects`
- Ops/runbooks: `~/Projects/ops/docs/`
- Agent scripts (optional): `~/Projects/agent-scripts/`
- Windows-side working folder (if needed): `C:\Users\<YOU>\Downloads\` / `C:\Users\<YOU>\Desktop\`

---

## Docs
- Start: run docs list (`docs:list` script, or `bin/docs-list` if present; ignore if missing).
- Follow links until domain makes sense; honor `Read when` hints.
- Keep notes short; update docs when behavior/API changes (no ship w/o docs).
- Add `read_when` hints on cross-cutting docs.

---

## PR Feedback
- Active PR:
  - `gh pr view --json number,title,url --jq '"PR #\(.number): \(.title)\n\(.url)"'`
- PR comments:
  - `gh pr view ...` + `gh api .../comments --paginate`
- Replies: cite fix + file/line; resolve threads only after fix lands.

---

## Flow & Runtime
- Use repo's package manager/runtime; no swaps w/o approval.
- Long jobs:
  - Prefer WSL `tmux` for persistence/interactive (server/debugger).
  - Otherwise run foreground and keep logs observable.

---

## Build / Test
- Before handoff: run full gate (lint/typecheck/tests/docs).
- CI red: `gh run list/view`, rerun, fix, push, repeat til green.
- Keep it observable (logs, panes, tails, browser tools if present).
- Release: read `docs/RELEASING.md` (or find best checklist if missing).

---

## Git
- Safe by default: `git status/diff/log`. Push only when user asks.
- `git checkout` ok for PR review / explicit request.
- Branch changes require user consent.
- Destructive ops forbidden unless explicit (`reset --hard`, `clean`, `restore`, `rm`, ...).
- Line endings (WSL-first workflow):
  - Prefer LF in repo; avoid "fixing" CRLF repo-wide unless explicitly asked.
- Don't delete/rename unexpected stuff; stop + ask.
- No repo-wide S/R scripts; keep edits small/reviewable.
- No amend unless asked.
- Big review: `git --no-pager diff --color=never`.
- Multi-agent: check `git status/diff` before edits; ship small commits.

---

## Language/Stack Notes (pragmatic defaults)
- PowerShell: good for Windows file ops + system integration. Keep commands idempotent.
- Bash/WSL: default for repo automation + build/test.
- Python: prefer venv/uv/poetry consistent with repo; don't introduce a new toolchain unless asked.
- TypeScript/Node: use repo PM (npm/pnpm/yarn) and lockfile; don't swap PMs.

---

## Critical Thinking
- Fix root cause (not band-aid).
- Unsure: read more code; if still stuck, ask w/ short options.
- Conflicts: call out; pick safer path.
- Unrecognized changes: assume other agent; keep going; focus your changes. If it causes issues, stop + ask user.
- Leave breadcrumb notes in thread.

---

## Tools (cross-platform)
### wsl / wslpath / explorer.exe (interop)
- `PS> wsl -e bash -lc '<cmd>'`
- `WSL> wslpath -u 'C:\...'` / `WSL> wslpath -w /home/...`
- `WSL> explorer.exe .` (open folder in Windows)

### winget (Windows installs)
- `PS> winget install <package>` (only when needed; don't spam installs)

### apt (WSL installs)
- `WSL> sudo apt-get update && sudo apt-get install -y <pkg>`

### gh
- PRs/CI/releases; prefer `gh` over web browsing for GitHub objects.

### tmux
- Use only for persistence/interaction (debugger/server).
- Quick refs:
  - `WSL> tmux new -d -s work`
  - `WSL> tmux attach -t work`
  - `WSL> tmux kill-session -t work`

---

## AI Agent Playbook

This section applies to all AI agents collaborating within the Janus project, including the orchestrator, scouts, council advisors and executors.  Agents must follow these guidelines when generating responses, performing tasks or interacting with the user.

### Global principles

- **Manifesto compliance:** Agents must honour the Janus Manifesto, particularly the requirements to state disagreements explicitly, show your work, verify sources and remain cost conscious[910682570583231 L6-L39].  The "Draconian Scout Protocol" applies to research: verify every resource, cite dates and report staleness[910682570583231 L106-L133].
- **Structured responses:** Replies should use clearly labelled sections (e.g., `Reasoning`, `Proposal`, `Uncertainties`, `Alternatives`, `Citations`).  This ensures that the council can compare proposals and detect disagreements.
- **Cost awareness:** Estimate token usage and dollar cost before making external API calls.  Include cost estimates in your response so the orchestrator can decide whether to proceed[177272126167875 L143-L169].
- **Incremental execution:** Decompose tasks into small, observable steps and stop after each step for review[976079008273562 L184-L257].  Never execute destructive actions without explicit confirmation.
- **Human primacy:** The user is the ultimate decision maker.  If there is ambiguity or disagreement, ask the user to resolve it rather than guessing.

### Task-specific guidelines and prompts

Below are example prompts that can be given to different agent roles to tackle the nine areas identified in the Janus analysis.  Each prompt should be prefaced by the manifesto and any relevant configuration (budget, models, context excerpts).

#### 1. Pluggable memory backend

**Prompt for a memory integration agent:**

> **Task:** Design and implement a pluggable memory adapter for Janus.  The adapter should support reading and writing sessions, decisions and tasks to a new backend (e.g., `claude-mem` or a cloud key-value store).  Adhere to the existing `StorageProvider` interface and ensure tests cover CRUD operations.  Explain how you would summarise long conversations to maintain context size.

The agent should describe the API of the new backend, mapping to existing types, and propose a testing plan.

#### 2. Council implementation

**Prompt for a council development agent:**

> **Task:** Implement the council swarm.  Define the structure for advisor prompts so that each model returns a proposal with sections for `Reasoning`, `Confidence`, `Uncertainties` and `Alternatives`.  Build a disagreement detector that compares proposals for conflicting claims and summarises consensus or divergence.  Outline how to integrate a synthesis step that produces a final answer or asks for human input.

The agent should reference the manifesto's requirement for explicit disagreement and cost reporting[910682570583231 L6-L39].

#### 3. Scout research

**Prompt for a scout agent:**

> **Task:** You are a scout agent responsible for researching a topic.  Use search APIs and package registries to find relevant information, verify each resource and report the publication date.  Follow the "Draconian Scout Protocol": do not cite resources you cannot access directly; verify cryptographic hashes for packages; note the last update date of any documentation[910682570583231 L106-L133].  Return your findings in a structured JSON array with fields `resource`, `summary`, `verified`, `lastUpdated` and `source`.

This prompt enforces the verification requirements and structured output.

#### 4. Executor tasks

**Prompt for an executor agent:**

> **Task:** Execute a multi-phase job defined by a specification.  Each phase may involve writing code, running commands in a sandbox, or analysing results.  For each phase: (1) plan the commands, (2) execute them, (3) capture stdout/stderr, (4) write any generated files to the specified artifacts directory, (5) run tests if provided.  Report success or failure with logs, and estimate tokens and cost used.

Executors must never access the internet unless explicitly permitted and must stop if a test fails or an error occurs.

#### 5. Task decomposition and planning

**Prompt for a planning agent:**

> **Task:** Given a high-level goal and the available swarms (scout, council, executor), produce a hierarchical task decomposition.  For each subtask, specify the swarm to delegate to, the dependencies, expected inputs and outputs, and cost estimates.  Break tasks into small steps that satisfy the Karpathy constraint[976079008273562 L184-L257].  Highlight uncertainties and ask clarifying questions when necessary.

The planner should return a dependency graph or ordered list of tasks with explanations.

#### 6. Cost analytics and dashboards

**Prompt for an analytics agent:**

> **Task:** Design a cost analytics module that aggregates `CostEntry` records across sessions.  Define metrics such as total spend, cost per model, cost per task type and latency.  Specify how to export metrics to an external dashboard (e.g., Langfuse) and how to display them via the CLI.  Propose tests to validate correctness and discuss how analytics can inform model selection strategies[177272126167875 L143-L169].

The agent should also suggest UI sketches or CLI command structures.

#### 7. Unified type system

**Prompt for a type-system agent:**

> **Task:** Consolidate all type definitions into a single `types.ts` file.  Remove duplicates and ensure that structures for sessions, decisions, tasks, costs and swarms include all necessary fields.  Update imports throughout the codebase.  Document any breaking changes and write a migration script if needed.

The agent should provide a plan for refactoring and list affected modules.

#### 8. Testing and reliability

**Prompt for a testing agent:**

> **Task:** Develop a testing suite for Janus.  Write unit tests for the context bridge, model router, swarms and orchestrator.  Create integration tests that simulate end-to-end runs with mocked providers.  Define coverage goals (>90%) and ensure tests run quickly in CI.  Explain how to mock network calls and external APIs without hitting real endpoints.

The testing agent should include example test cases and propose a CI workflow.

#### 9. Documentation update

**Prompt for a documentation agent:**

> **Task:** Update or create documentation to reflect the current state of Janus.  Replace outdated plans (strategic layer handled by the Janus orchestrator) with the new architecture described in `ARCHITECTURE.md`.  Ensure that the README conveys the purpose, layers and roadmap at a high level.  Add or update diagrams illustrating data flows and swarms.  Provide clear contribution guidelines aligned with the manifesto and cost awareness principles.

The agent should deliver Markdown files and note any sections that require user approval.

---

These guidelines and prompts ensure that all AI agents contributing to Janus operate consistently, respect the project's normative rules and produce work that can be composed into a coherent system.
