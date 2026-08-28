# The Loop Engineering Playbook (distilled)

A synthesis of ideas on agent loops as compiled in a working note supplied by
the user. The note attributes its frameworks to Addy Osmani (the "Loop
Engineering" framing), Prithvi Rajasekaran (generator/evaluator findings), and
Steve Kaliski (Stripe's Minions pipeline). **These attributions and all
specific figures (e.g. PR throughput numbers) are AS REPORTED in that note and
have not been independently verified — no source URLs were available to check.
Treat them as illustrative of the design patterns, not as citable facts.** The
design guidance itself stands on its own merits.

## Definition and the four-layer stack

Loop engineering is **replacing yourself as the person who prompts the agent,
and designing the system that does it instead**. It is the fourth layer of a
stack:

| Layer | Minds | Core question |
|---|---|---|
| Prompt eng. | one prompt | what should I tell the model |
| Context eng. | one window | what to retrieve, summarize, clear |
| Harness eng. | one run | which tools, which actions, what counts as done |
| Loop eng. | the schedule | how to make it run itself over and over |

Three verbs separate harness from loop: it **runs on a timer**, it **spawns
helpers**, and it **feeds itself** (its output becomes next round's input via
files on disk). The higher the layer, the farther the human is from the scene
and the longer mistakes pile up: a prompt-layer mistake is one wrong answer
seen immediately; a loop-layer mistake is written into the state file, read
back tomorrow as established fact, and built upon until it is load-bearing.

**The core intuition: the cost of a mistake scales with the number of turns it
survives before someone catches it, and a loop is, by construction, a machine
for maximizing turns.** Everything else — evaluator, checkpoints, caps —
exists to shorten the distance between a mistake and its discovery.

## The five moves of one turn

1. **Discovery** — the loop finds its own work (reads CI failures, open
   issues, recent commits, prior state). Sets the ceiling on the whole loop's
   quality. Must live in a named, maintainable skill, not instructions pasted
   into a cron job.
2. **Handoff** — each task goes to a worker in isolation (one git worktree per
   task). The cleaner the cut, the easier verification and merging.
3. **Verification** — a *different* agent reviews the work. The thing that can
   say "no". A loop without a real check is an agent nodding at itself.
4. **Persistence** — results land somewhere that survives the conversation: a
   PR, a state file, a board, an inbox. The agent forgets; the repo does not.
5. **Scheduling** — a real trigger makes one turn into a loop, and the state
   file lets unfinished work carry to the next turn.

## The six parts

| Part | What it is | Maps to |
|---|---|---|
| Automations | runs off a schedule/trigger | Scheduling |
| Worktrees | isolated dirs for parallel agents | Handoff |
| Skills | permanent knowledge; pays off *intent debt* | Discovery |
| Connectors (MCP) | hookup to external systems; the loop's radius of vision | Persistence / Discovery |
| Sub-agents | generator separated from judge | Verification |
| Memory | persistent state on disk | Persistence |

## The five anti-patterns (one per skipped move)

- **Nodding Loop** (no verification): self-approved output at machine speed;
  symptom: it has never once said "no" across hundreds of turns.
- **Amnesiac Loop** (no persistence): no cumulative progress; rediscovers or
  redoes the same work each morning.
- **Manual Loop** (no scheduling): a script the human forgets to run; last run
  was demo day.
- **Blind Loop** (no discovery): the human still assigns the work; the
  expensive part (choosing) was never automated.
- **Tangled Loop** (no handoff): parallel agents collide in one working
  directory; appears the first morning five agents run at once.

They cluster: hasty builds install discovery + handoff (visible output) and
skip the three that produce safety.

## Generator and evaluator

- An agent grading its own output praises it: its context is stuffed with the
  chain of self-persuasion that produced the code. Inside a loop this
  amplifies every round.
- **Tune a skeptic, don't fix a modest author**: making a standalone evaluator
  picky is tractable; making a generator self-critical is not. Structural fix,
  not wording.
- **The evaluator should act, not just read**: run tests and paste real
  output; drive the UI via Playwright MCP (click, screenshot, inspect DOM).
  Judge behavior, not intent. Swap the underlying model too — same model with
  new instructions keeps its blind spots. Default stance: assume broken until
  proven otherwise.
- **Maker–checker stop condition**: completion is judged by a fresh small
  model against an explicit condition (e.g. "all tests in test/auth pass and
  the lint step is clean"), never by the agent doing the work. The working
  note attributes this to a `/goal` command (run until condition met, judged
  independently, vs. `/loop` = merely rerun on an interval) — verify the
  command exists in your toolchain version before citing it; the pattern can
  always be built manually with a post-turn judge step.
- A loop's floor is its evaluator: the generator's level decides what it can
  produce; the evaluator's level decides what it will not produce.

Example evaluator agent:

```
# .claude/agents/reviewer.md
ROLE: Adversarial code reviewer.
ASSUME: this code is BROKEN until proven otherwise.
DO NOT praise. Find what fails.
CHECK, in order:
1. Does it run? (execute, don't read)
2. Tests: run them, paste real output.
3. Edge cases the author skipped.
4. Does behavior match the ticket?
USE Playwright MCP: open the page, click, screenshot, inspect the DOM.
Judge behavior, not intent.
VERDICT: PASS only if every check holds. Otherwise REJECT + list each reason.
```

## Real loops

- **Osmani's morning triage**: automation fires a triage skill each morning →
  reads failed CI, open issues, recent commits → writes findings to a state
  file/board → per-finding worktree with a drafting sub-agent and a reviewing
  sub-agent → connector opens PRs and updates tickets → uncertain items go to
  an inbox for a human.
- **Stripe Minions** (~1,300 machine-written PRs merged/week): trigger is an
  @-mention or emoji in Slack. A *deterministic orchestrator* assembles
  context (Jira, links, Sourcegraph + MCP) before the model wakes; anything
  deterministic logic can solve never goes to a probabilistic model. Hard-coded
  gates interleave with LLM steps (agent writes → linter runs, unskippable →
  agent fixes lint → hard-coded commit). Fork of open-source Goose:
  **reliability comes from the quality of the constraints, not the size of the
  model.** Sandbox is disposable ("cattle not pets"). All PRs still
  human-reviewed — the human changed desks from writing to reviewing.

## Scheduling options

| | Cloud | Desktop scheduled task | local `/loop` |
|---|---|---|---|
| Runs | cloud | machine | machine |
| Machine on? | no | yes | yes |
| Min interval | ~1 h | 1 min | 1 min |
| Sees local files? | no | yes | yes |

Rule: work glued to the local machine → local scheduling; work that can leave
(e.g. scan issues at 3 a.m. and open PRs) → cloud/CI schedule. Local rerun
means "a few extra rounds while I am here"; cloud means "runs even when I am
not". Mature loops use both: local for tight inner checks, cloud for the
overnight sweep. The capabilities are toolchain-portable (Claude Code `/loop`,
`/goal`, `--worktree`, `.claude/agents/`, MCP, SKILL.md, Cloud Routines have
Codex equivalents) — ask whether all six parts are present, not which brand
provides them.

## The four silent costs (and guards)

1. **Verification debt** — unverified output accumulating between "runs" and
   "right". Guard: independent evaluator.
2. **Comprehension rot** — the codebase grows while your mental map stalls.
   Guard: read a representative sample daily and explain each sampled change;
   inability to explain = the map is stale.
3. **Cognitive surrender** — you stop having opinions and take what it hands
   back. Guard: the loop can execute, but it cannot decide; keep at least one
   checkpoint where it pauses for a human — the open door is a permanent
   feature, not scaffolding to remove once trusted.
4. **Token blowout** — helpers, retries, all-night spins. Guard: hard caps
   (per-run budget, daily budget, max retries) set *before* the first
   unattended run; a loop without caps has delegated spending authority to its
   own bugs.

They reinforce in a cycle: unverified output → less understanding → more
surrender → longer unwatched runs and bigger bills → more unverified output.
All four are silent while the loop runs.

## Economics and posture

Loops make generation nearly free; **judgment stays scarce** — knowing which
plan is right, which line to stop, which output runs fine but is wrong at the
root. The loop chooses on "looks reasonable", not "actually right"; the gap
between those is where engineering lives. The loop is a faithful multiplier
of whatever its builder brings — understanding or laziness — and a lapse in
judgment is executed faithfully, in bulk, with no slow gear left to catch it.
Two people can build 90%-identical loops and end in opposite places; the
difference is one or two checkpoints. Build the loop like someone who intends
to stay the engineer, not just the one who presses go.

## First-loop recipe

1. Run a `/loop` (interval rerun) to get a trigger.
2. Give it discovery: read CI + issues + commits, triage into a list. The
   discovery logic lives in a skill, not the schedule.
3. Add a state file (`state/triage.md`, one row per finding: finding, source,
   priority, status). Commit it so tomorrow can read it.
4. Add an evaluator and a `/goal` stop condition (the most critical step and
   the easiest to skip).
5. Add per-finding worktrees for parallelism — last, after checks are proven.

First-loop checklist (miss one and it's a failure in disguise):
**discovery source · real trigger (schedule) · state file · independent
evaluator · isolation · token cap · human review point.**

Skill template for discovery (headings map to the moves; **Stop** is where the
builder's non-inferable boundaries are written in — leave it out and the loop
merges with confidence it has not earned):

```
# .claude/skills/morning-triage-discovery/SKILL.md
## Read      — CI failed since last run; issues < 24h; commits since yesterday;
               the previous state file
## Judge     — actionable or noise? blocks a release? already tracked?
## Write     — append | finding | source | priority | status | to state; commit
## Hand off  — per kept finding: worktree=fix/<slug> goal=<stop-condition>
## Stop      — Never merge. Never delete. Anything less than confident goes
               to ./inbox/ for a human, not into a PR.
```

Growth order: widen discovery → prove the evaluator on real mistakes → then
add parallelism. A loop earns the right to run more agents by demonstrating
it can stop a single bad one. The small loop that earned trust survives; the
ambitious one that demanded it does not.
