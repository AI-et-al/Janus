---
name: loop-engineering
description: >-
  Design and build a self-running loop system around a goal the user sets for
  an AI agent — discovery, verification, persistence, scheduling, and human
  checkpoints. Trigger when the user wants an agent working toward a goal
  autonomously or unattended over time ("keep the tests green", "have an agent
  chip away at X while I sleep", "triage and fix issues on their own"), even
  if they never say "loop". Do NOT trigger for single recurring actions with no discovery or
  verification to design ("check the deploy every 5 minutes", "remind me each
  morning") — those belong to the simpler loop/schedule tooling.
---

# Loop Engineering: Turn a Goal into a Self-Running Loop

You are not here to do the goal yourself. You are here to design and build the
**system that prompts the agent** — a loop that discovers work, does it,
verifies it, remembers it, and reschedules itself, with a human still able to
say "no". The full playbook this is based on is in
`references/playbook.md`; read it when you need depth on any concept below.

The central intuition: **the cost of a mistake scales with the number of turns
it survives**, and a loop is a machine for maximizing turns. Every design
decision below exists to shorten the distance between a mistake and its
discovery.

## Step 1 — Interrogate the goal

Before building anything, pin down:

1. **The goal as a verifiable condition.** Rewrite the user's goal so a fresh
   model with no context could judge whether it holds (e.g. "all tests in
   `test/auth` pass and lint is clean", not "improve auth"). If the goal can't
   be stated as a checkable condition, negotiate it into one — a loop without
   a checkable stop condition can only nod at itself.
2. **The discovery source.** What does the loop *read* to find its own work
   each turn? (CI failures, open issues, a backlog file, recent commits, an
   inbox.) If the human must hand it work each morning, you've built a Blind
   Loop — automated the doing, not the finding.
3. **Where it must run.** Glued to local files/processes → local scheduling
   (machine must stay on, minute-level intervals). Can leave the machine →
   cloud/CI scheduling (runs while the user sleeps, ~hourly minimum, fresh
   clone each run). Mature loops often use both.
4. **The boundaries the loop cannot infer.** What must it never do (merge,
   delete, deploy, spend)? Where does the human want to look before anything
   ships? These live only in the user's head — ask, then write them in.

## Step 2 — Design one turn: the five moves

Every turn of the loop must make all five moves. A skipped move is a named
failure (see the anti-pattern table below).

| Move | What it does | Realized by |
|---|---|---|
| **Discovery** | Finds this turn's work on its own | a named skill that reads sources + prior state |
| **Handoff** | Hands each task off in isolation | one git worktree (or branch/sandbox) per task |
| **Verification** | An independent check that can say "no" | a separate evaluator agent + explicit stop condition |
| **Persistence** | Writes state that survives the conversation | a state file / board committed to the repo |
| **Scheduling** | Makes it turn again without a human | cron / CI schedule / Routine / `/loop` |

| Move skipped | Failure | Symptom |
|---|---|---|
| Verification | Nodding Loop | never once said "no" to itself |
| Persistence | Amnesiac Loop | every morning starts from zero, redoes work |
| Scheduling | Manual Loop | last run was the day it was demoed |
| Discovery | Blind Loop | human still spends mornings assigning work |
| Handoff | Tangled Loop | parallel agents collide in one directory |

## Step 3 — Build the parts

The playbook's six parts are **automations, worktrees, skills, connectors,
sub-agents, memory** (see `references/playbook.md` for the part→move mapping).
Realize them as concrete artifacts, not advice. A complete build produces
seven deliverables — the six parts plus the budget-cap guard:

1. **A discovery skill** (`.claude/skills/<goal-slug>-discovery/SKILL.md`):
   what to read, how to judge "actionable vs. noise", what to write to state,
   and a **Stop section** — the boundaries from Step 1, written in. The Stop
   section is the one place the user's intent about control is made permanent;
   never omit it. Automation must trigger this named skill, not a wall of
   instructions pasted into a cron job nobody will update.
2. **A state file** (e.g. `state/<goal-slug>.md`): one row per finding —
   finding, source, priority, status. The agent forgets; the repo does not.
   Memory is not context: context is flushed, memory persists across days.
3. **An evaluator agent** (`.claude/agents/<goal-slug>-reviewer.md`) — see
   Step 4. This is where the engineering effort belongs.
4. **The schedule**: a GitHub Actions `schedule:` workflow, cloud Routine, or
   local `/loop` — chosen per Step 1.3, with the tradeoff stated to the user.
5. **Isolation**: per-task worktrees (`--worktree`) whenever more than one
   task can run in a turn.
6. **Connectors**: the loop's read/write hookup to external systems (GitHub
   for PRs and issues, the tracker, Slack — usually via `gh` or MCP). A loop
   that can only see the filesystem is a tiny loop; if the design opens PRs or
   updates tickets, name the mechanism that does it — and give unattended runs
   a scoped, least-privilege credential (a repo-scoped token with only the
   permissions the loop needs), never a personal PAT or broad admin token.
7. **Budget caps**: per-run budget, daily budget, max retries — set *before*
   the first unattended run. A loop without caps has delegated its spending
   authority to its own bugs.

Anything rule-bound (linting, committing, assembling context from known
sources) should be a deterministic step the agent cannot skip, not a request
to the model. Reliability comes from the quality of the constraints, not the
size of the model.

## Step 4 — The evaluator (the part that can say "no")

The agent that wrote the work will praise it — it sees its own chain of
self-persuasion, not the result. Tuning an independent skeptic is far more
tractable than making a generator self-critical. So:

- **Separate agent, different instructions**, ideally a different model. Its
  default stance: *assume the work is broken until proven otherwise*.
- **It acts, it doesn't just read**: run the tests and paste real output,
  execute the code, click the UI via Playwright MCP, check behavior against
  the ticket. "Looks right" is not a verdict.
- **Verdict format**: PASS only if every check holds; otherwise REJECT with
  each reason listed.
- **The stop condition is judged by a fresh model**, not the one doing the
  work (maker–checker). If the toolchain has a run-until-condition primitive
  (e.g. a `/goal`-style command — verify it exists in the current version
  before relying on it), use it; otherwise build the check yourself: after
  each turn, a separate deterministic step or fresh-model call evaluates the
  stop condition and decides whether another turn runs. A plain interval
  rerun (`/loop`) is not this — it repeats without judging.

A loop's floor is its evaluator: the generator decides what it *can* produce,
the evaluator decides what it *won't*.

## Step 5 — Keep the human in the loop's design

Install these guards explicitly and tell the user which is which:

- **One open door**: at least one checkpoint where the loop pauses for a human
  — PRs opened but never auto-merged; anything uncertain goes to an inbox
  (e.g. `inbox/`), not into a PR.
- **Read a sample**: advise the user to read a small daily sample of the
  loop's output and explain each change to themselves; inability to explain
  means comprehension rot has started.
- **Caps before shipping** (Step 3.7) against token blowout.

Together with the independent evaluator built in Steps 3–4 (the guard
against verification debt), these cover the four silent costs — verification
debt, comprehension rot, cognitive surrender, token blowout — which reinforce
each other into one compounding failure.

## Step 6 — Start small, grow in the safe order

Ship the smallest loop that has **all six parts** — one finding handled end to
end beats an ambitious loop missing its checks. Then grow in this order:
widen discovery first, prove the evaluator catches real mistakes, and add
parallelism **last**. A loop earns the right to run more agents by first
demonstrating it can stop a single bad one.

## Deliverable

When this skill runs against a goal, the output is:

1. A short **loop design** summary: the goal as a stop condition, the five
   moves mapped to concrete mechanisms, scheduler choice with tradeoff, and
   the human checkpoints.
2. The **artifacts** from Step 3, created in the repo.
3. A **first-run plan**: how to trigger turn one manually, what to check
   afterward, and what "working" looks like.

Walk the first-loop checklist before calling it done: discovery source ·
real trigger (schedule) · state file · independent evaluator · isolation ·
token cap · human review point. The first five map to the five moves — a loop
missing one of those is one of the five named failures wearing a disguise;
the last two guard the silent costs (token blowout, cognitive surrender).
