# JANUS

<p align="center">
  <img src="assets/banner.png" alt="Janus" width="100%">
</p>

---

## The Problem With Asking One Oracle

Here's something that bothered me: we have access to multiple frontier language models, each trained on slightly different data with slightly different architectures and slightly different RLHF, and our default interaction pattern is to pick one and trust it.

This is like having access to three doctors who went to different medical schools, trained in different hospitals, and developed different clinical intuitions—and only ever consulting one of them. The interesting information is often in *where they disagree*.

When Claude says "this approach has serious security implications" and GPT says "this is standard practice," that delta isn't noise. It's signal. It's the thing you actually want to know about. But our tools hide it from us, because our tools are built around the assumption that you want *an answer*, not *a map of the answer space*.

Janus is an attempt to fix this.

---

## What This Actually Is

Three language models—Claude, GPT, Gemini—receive the same prompt in parallel. Each produces a response with:
- A proposal
- A confidence level
- A list of uncertainties
- Alternatives they considered and rejected

Then we diff them. Where do they agree? Where do they diverge? On what does their confidence correlate, and on what does it anti-correlate?

You get to watch this happen. You see the reasoning. You see the disagreement. Then *you* decide what to do with it.

```
┌────────────────────────────────────────────────────────────┐
│                        THE COUNCIL                         │
├──────────────────┬──────────────────┬──────────────────────┤
│      CLAUDE      │       GPT        │       GEMINI         │
│                  │                  │                      │
│  "OAuth 2.0 with │  "JWT with RSA   │  "Consider PASETO,   │
│   PKCE. Note the │   signing. PKCE  │   it addresses JWT   │
│   token refresh  │   has replay     │   weaknesses. Also:  │
│   race condition │   risks if..."   │   what's your scale?"│
│                  │                  │                      │
│  Confidence: 85% │  Confidence: 78% │  Confidence: 72%     │
├──────────────────┴──────────────────┴──────────────────────┤
│  ⚠ DISAGREEMENT: replay vulnerability assessment differs   │
└────────────────────────────────────────────────────────────┘
```

The Council doesn't vote. It doesn't synthesize into mush. It presents its disagreements to you because its disagreements are the most valuable thing it has to offer.

---

## Why Bother

Language models are, among other things, compressed representations of human knowledge and reasoning patterns. Different models compress differently. They have different priors, different blindspots, different strengths.

GPT tends toward confident, structured responses. Claude tends toward nuance and hedging. Gemini tends toward breadth. These aren't bugs—they're features of different training regimes that captured different aspects of the space of reasonable responses.

When you query one model, you get one sample from one distribution. When you query three and look at their disagreements, you get something closer to the *shape* of the uncertainty. You learn not just "what might be true" but "what the range of defensible positions looks like."

This is useful if you're trying to make decisions rather than just get answers.

---

## The Karpathy Constraint

There's a failure mode in AI tooling where the tool tries to be impressive. It goes off for twenty minutes and comes back with a thousand lines of code and you have no idea if any of it is right.

Andrej Karpathy has been pretty clear about not wanting this:

> *"I want to mass-execute short tasks, looking at each one... I don't want the agent to go off for 20 minutes and mass-execute 50 writes."*

Janus follows this principle. Everything happens in chunks you can hold in your head. The Council proposes, you approve. Subagents execute bounded tasks and report back. Nothing happens in the dark.

If you want an AI that disappears for an hour and returns with a fait accompli, this isn't it. If you want to stay in the loop while AIs do the cognitive heavy lifting, this might be useful.

---

## Architecture (Short Version)

**Strategic layer**: You talk to Claude (Opus) in claude.ai. This is where you think through problems, make architectural decisions, define what needs to happen.

**Context Bridge**: A Git-backed store that persists your decisions, session summaries, and pending tasks. This is the memory that survives when the browser closes.

**Execution layer**: The Claude Agent SDK runs subagent swarms:
- *Scouts* (Haiku): Verify URLs, check if packages exist, validate resources. They're not allowed to speculate—if they can't provide a working link, they report failure.
- *Executors* (Haiku): Implement bounded tasks. Write code, run tests, produce artifacts.
- *Council* (Opus/GPT/Gemini): Deliberate on questions that benefit from multiple perspectives.

Everything flows through the Context Bridge so the next session knows what the previous one decided.

---

## Constraints As Features

The Manifesto (which every subagent receives) includes this rule:

> When the human specifies a constraint, treat it as sacred. "Must use OAuth 2.0" means OAuth 2.0, not "here's why you should consider alternatives."

This sounds obvious but most AI tooling gets it wrong. The model optimizes for appearing helpful, which often means offering alternatives to what you asked for. But you have context the model doesn't. Your constraints encode decisions already made. Respecting them is respecting your judgment.

If you ask Janus for TypeScript, you get TypeScript. If you ask for minimal dependencies, you don't get a framework recommendation. The sophistication is in working within constraints, not in escaping them.

---

## Current Status

This is early. The architecture is documented, the types are defined, the scaffolding exists. The interesting parts—Council deliberation protocol, disagreement detection, observable UI—are not yet implemented.

What exists:
- [x] Vision and architecture documentation
- [x] TypeScript project scaffold
- [x] Context Bridge design
- [x] MANIFESTO (rules for subagents)
- [x] CLI skeleton

What doesn't:
- [ ] Council deliberation implementation  
- [ ] Multi-model API adapters
- [ ] Disagreement detection
- [ ] Observable deliberation UI
- [ ] Scout and Executor swarms

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

---

## Who This Is For

You probably want this if:
- You have API keys for multiple frontier models and are willing to pay for quality
- You'd rather understand a decision than receive a recommendation
- You've noticed that different models give usefully different answers to the same question
- You're suspicious of tools that hide their reasoning

You probably don't want this if:
- You want a magic button that just works
- You prefer single-model simplicity
- You trust AI outputs without inspection

---

## The Name

Janus: Roman god of doorways, beginnings, transitions. Two faces—one looking back, one looking forward. 

Also: the two faces represent multiple perspectives on the same reality. Different views, same underlying truth. That's more or less what multi-model deliberation gives you.

---

## License

MIT. Do what you want with it.

---

<p align="center">
  <em>"The map is not the territory, but three maps from different cartographers <br>gives you a better sense of where the territory actually is."</em>
</p>
