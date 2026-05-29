# Triage Copilot — `issue-triage-skills`

Workshop demo for **"From Big Prompts to Reliable React Agents."** The payoff to
`issue-triage-2x`: the _same_ chat copilot, fixed with **Agent Skills +
progressive disclosure**.

```
tiny-agent           the raw loop, by hand (CLI)
issue-triage         near-production, single-shot, structured output (AI SDK v6)
issue-triage-2x      a CHAT agent, scaled the naive way: everything in context
issue-triage-skills  the same copilot, fixed: a thin prompt that loads what it needs   ← you are here
```

`issue-triage-2x` crammed the entire knowledge base — ~18 runbooks, every policy,
a 180-entry incident archive — into one ~14k-token system prompt re-sent every
turn, and drifted: dropped rules, the wrong runbook, contradictions. This app
keeps the **exact same** runbooks, policies, and canary rules, but stops pasting
them. It carries a **thin** system prompt and reaches for knowledge on demand,
using Vercel's [`bash-tool`](https://github.com/vercel-labs/bash-tool):

- a **`skill`** tool whose description is an always-on _index_ — one
  `skill("rb-…"): <when to use it>` line per runbook. The agent loads only the
  one or two runbook bodies an issue actually needs.
- a **`bash`** tool (local [`just-bash`](https://www.npmjs.com/package/just-bash)
  sandbox — no Vercel account) that can `grep` the incident archive on disk
  instead of carrying 180 entries in context.

> **The lesson: capability comes from the right context, not all of it.** Same
> knowledge, same rules — but now uncrowded, so the model keeps them. The runbook
> it loads is _visible_ in the activity log, and the context meter stays small
> (and flat) no matter how big the knowledge base grows.

---

## What this demo teaches

- **Progressive disclosure beats stuffing.** Level 1: a one-line index of every
  skill (cheap, always present). Level 2: the agent loads a skill's full body only
  when it's relevant. Level 3: `grep` a big corpus (the incident archive) instead
  of pasting it.
- **The drift was a context problem, not a model problem.** The canary rules
  R1–R5 that `2x` dropped under load are obeyed here — they're no longer buried.
- **Context stays flat as the KB grows.** Add a 100th runbook and `2x`'s prompt
  grows by a runbook every turn; here only the _index_ grows by one line, and the
  body is loaded only if it's the match.

---

## How it's built (the "after")

`lib/triage/context.ts` now assembles only the small, always-relevant pieces:

```
preamble (you have a `skill` tool; load what you need)
+ response rules (R1, R2)
+ severity rubric / SLA tiers (R3) / escalation / tone / compliance (R4) / glossary
+ sign-off rule (R5)
+ a short skill-workflow note
                                      ← NO runbook bodies, NO incident archive
```

The 18 runbooks live as individual **Agent Skills** on disk — `skills/<rb-id>/SKILL.md`,
generated from the shared `RUNBOOKS` data by `scripts/build-skills.ts` (so the
skill body is the exact text `2x` pasted inline). At request time
`app/api/chat/route.ts` hands a `ToolLoopAgent` to `createAgentUIStreamResponse`;
the agent (`lib/triage/agent.ts`) is built once with the `skill` + `bash` tools
from `bash-tool` and the thin prompt. The agent reads the issue → picks a runbook
from the index → `skill("rb-…")` to load it → optionally `grep`s `incidents.md` →
answers.

The streamed UI message carries the model's reasoning summary, its `tool-*` calls
(rendered as the **Agent activity** timeline), and its real token usage (rendered
in the **context meter**). The route is `runtime = "nodejs"` because just-bash
needs Node, and `bash-tool`/`just-bash` are in `serverExternalPackages`
(`next.config.ts`) because just-bash ships a CPython WASM that webpack can't bundle.

---

## What to watch (the payoff)

Same five **canary rules** as `2x`, same `RUNBOOKS` — now they hold:

| Rule   | What it says                                             | In `issue-triage-skills`                                   |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------- |
| **R1** | end every reply with `Refs: [RB-…]`                      | ✅ correct, single runbook (`Refs: [RB-SSO-01]`)            |
| **R2** | plain prose, no markdown                                 | ✅ holds                                                    |
| **R3** | state the SLA target (minutes) **before** steps          | ✅ and _correctly derived_ (Business P1 = 60 min, from the matrix — not a runbook's enterprise "30 min" literal) |
| **R4** | refunds **over $50 need approval** — never promise first | ✅ routes to finance, refuses to promise                    |
| **R5** | sign off as `— Triage Copilot`                           | ✅ holds                                                    |

And **no runbook conflation**: ask the vague "several users report timeouts" and
the activity log shows it loading **one** runbook and committing to it, not
blending the ~8 that mention "timeouts".

### The two visible wins

1. **Agent activity** — the timeline shows exactly which runbook it loaded
   (`Loading runbook · rb-sso-01`) and any `Searching incidents` grep.
2. **Context meter** — real per-turn `inputTokens`. A turn that loads one runbook
   runs a few thousand tokens (thin prompt + skill index + the one loaded body,
   heavily prompt-cached) versus `2x`'s ~14k _every_ turn — and it stays flat as
   the runbook count grows.

### Starter prompts (in the UI, or type your own)

1. **Two issues at once** — loads the two relevant runbooks.
2. **Ambiguous "timeouts"** — loads the single best runbook, no conflation.
3. **Enterprise SSO outage** — deep step-by-step; exercises R3 + R1.
4. **$200 refund** — exercises R4 (now respected, not dropped).

Compare side-by-side with `issue-triage-2x` for the full before/after.

---

## Stack

- Next.js (App Router) · React 19 · TypeScript
- Vercel AI SDK **v6** (`ai`) — `ToolLoopAgent` + `createAgentUIStreamResponse` + `@ai-sdk/react` (`useChat`) — with `@ai-sdk/openai`
- **`bash-tool`** (skill loader + bash) on a local **`just-bash`** sandbox — no Vercel account needed
- Tailwind CSS v4 · Geist · Phosphor icons (same design system as `issue-triage`)

---

## Setup

```bash
cd issue-triage-skills
npm install
npm run build:skills          # generate skills/<rb-id>/SKILL.md from RUNBOOKS (committed; re-run if runbooks change)
cp .env.example .env.local    # then add your key
```

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-mini       # optional; this is the default
```

```bash
npm run dev          # http://localhost:3000
npm run build        # production build (also type-checks)
npm run typecheck    # tsc --noEmit
```

---

## Project structure

```
app/
  layout.tsx
  page.tsx                 # Server Component: reads CONTEXT_STATS, renders <Chat>
  globals.css
  api/chat/route.ts        # createAgentUIStreamResponse({ agent }) — runtime = "nodejs"
components/
  Chat.tsx                 # useChat chat UI (messages, reasoning, activity timeline, composer, starters)
  AgentActivity.tsx        # the live "which runbook did it load / grep" timeline
  ContextMeter.tsx         # the "how much is really in context" pill (real token usage)
lib/triage/
  runbooks.ts              # ~18 runbooks (deliberately overlapping) + incident-archive generator (UNCHANGED from 2x)
  policies.ts              # severity / SLA / escalation / tone / compliance + canary rules R1–R5 (UNCHANGED from 2x)
  context.ts               # assembles the THIN system prompt + CONTEXT_STATS
  agent.ts                 # the ToolLoopAgent: skill + bash tools (built once, cached)
  chat-types.ts            # ChatMetadata (token usage) + the typed chat message
scripts/
  build-skills.ts          # RUNBOOKS → skills/<rb-id>/SKILL.md (reuses renderRunbook)
skills/
  rb-chk-01/SKILL.md …     # 18 generated, committed skills (one per runbook)
```

---

## How it differs from `issue-triage-2x`

`runbooks.ts` and `policies.ts` are **identical** — same knowledge, same planted
rules. Everything else is the fix:

| | `issue-triage-2x` | `issue-triage-skills` |
| --- | --- | --- |
| Knowledge in prompt | all 18 runbooks + 180 incidents, every turn | none — a thin prompt only |
| Runbooks | pasted inline | `skills/<rb-id>/SKILL.md`, loaded on demand via `skill` |
| Incident archive | pasted inline (pure bloat) | on disk, `grep`-ed via `bash` |
| Route | `streamText({ system: SYSTEM_PROMPT })` | `createAgentUIStreamResponse({ agent })` |
| Per-turn input | ~14k and growing | a few k, flat |
| Canary rules R1–R5 | drift / dropped under load | held |

---

## Intentionally not done (yet)

- **Evals** — regression cases that catch drift (e.g. "did it keep R1–R5?", "did
  it load exactly the right runbook?").
- **Context engineering for long chats** — summarize/trim history as the
  conversation grows.
