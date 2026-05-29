# Triage Copilot — `issue-triage-2x`

Workshop demo for **"From Big Prompts to Reliable React Agents."** The third
agent in the arc, and the one that motivates the back half of the workshop.

```
tiny-agent           the raw loop, by hand (CLI)
issue-triage         near-production, single-shot, structured output (AI SDK v6)
issue-triage-2x      a CHAT agent, scaled the naive way: everything in context   ← you are here
```

`issue-triage-2x` does _more_ than `issue-triage`: it's a multi-turn **chat**
triage copilot that knows the whole product — ~18 runbooks, every support
policy, and a long incident archive. The catch is **how** it knows all that: we
cram the entire knowledge base into one system prompt and re-send it on every
turn.

> **The lesson: more context ≠ more capable.** Scaling an agent by stuffing its
> context is the obvious move and the wrong one. Watch the answers drift as the
> context piles up — dropped rules, the wrong runbook, contradictions across
> turns. That drift is the problem **Agent Skills + progressive disclosure**
> solve later (load only the runbook you actually need).

---

## What this demo teaches

- **Context is a budget, not a junk drawer.** Everything you paste "just in case"
  competes for the model's attention and dilutes the instructions that matter.
- **Drift is a reliability bug, not bad luck.** A big static context makes it
  predictable: rules buried in the middle get dropped ("lost in the middle"),
  and a long chat lets recent turns outweigh the system prompt.
- **This is the case _for_ Skills.** `issue-triage` was single-shot, so there was
  nothing to "progressively disclose." A chat copilot with 18 runbooks is the
  example where retrieval/progressive disclosure obviously wins.

---

## How it's (deliberately) built wrong

`lib/triage/context.ts` concatenates **everything** into one `SYSTEM_PROMPT`:

```
preamble
+ response rules (R1, R2)            ← top of the prompt
+ severity rubric
+ SLA tiers           (rule R3)      ← buried in the middle
+ escalation matrix & contacts
+ communication / tone
+ compliance          (rule R4)      ← buried in the middle
+ glossary
+ ALL ~18 runbooks, full text
+ 180-entry incident archive         ← bulk that buries the middle rules
+ sign-off rule (R5)                 ← bottom of the prompt
```

That whole blob (~13k tokens) is sent as `system` on **every** turn (`app/api/chat/route.ts`),
with **no retrieval and no tools** — nothing is loaded on demand. The header's
context meter shows the size. There is no structured output and no validation
here: it's a chat, and the point is the _content_ drifting, not the shape.

---

## What to watch for (the drift)

Five specific, checkable **canary rules** are planted at different depths of the
prompt. Small context → the model obeys them. As the runbooks/archive bury them
and the chat grows, it drops them — usually the buried ones first:

| Rule   | Where  | What it says                                             | Typical drift                       |
| ------ | ------ | -------------------------------------------------------- | ----------------------------------- |
| **R1** | top    | end every reply with `Refs: [RB-…]`                      | survives longest, then vanishes     |
| **R2** | top    | plain prose, no markdown                                 | drifts into bullet lists / headers  |
| **R3** | middle | state the SLA target (minutes) **before** steps          | dropped early                       |
| **R4** | middle | refunds **over $50 need approval** — never promise first | dropped → it just offers the refund |
| **R5** | bottom | sign off as `— Triage Copilot`                           | dropped early                       |

Plus **runbook conflation**: ~7 runbooks mention "timeouts" (checkout gateway,
login/IdP, dashboard widget, API 429, webhooks, sync…). Ask a vague "users see
timeouts" and watch it grab the wrong one or blend several.

### Starter prompts (in the UI, or type your own)

1. **Two issues at once** — juggling multiple runbooks in one turn.
2. **Ambiguous "timeouts"** — triggers runbook conflation.
3. **Enterprise SSO outage** — a deep step-by-step that should trigger R3 + R1.
4. **$200 refund** — should trip R4; the bloated context tends to drop it and
   just offer the refund.

**To force the drift:** keep chatting. Ask 4–6 follow-ups in
one session. The longer the conversation, the more the early rules decay

---

## Stack

- Next.js (App Router) · React 19 · TypeScript
- Vercel AI SDK **v6** (`ai`) — `streamText` + `@ai-sdk/react` (`useChat`) — with `@ai-sdk/openai`
- Tailwind CSS v4 · Geist · Phosphor icons (same design system as `issue-triage`)
- **No tools, no retrieval, no database** — everything lives in the system prompt (on purpose)

---

## Setup

```bash
cd issue-triage-2x
npm install
cp .env.example .env.local   # then add your key
```

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-mini      # optional; this is the default
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
  api/chat/route.ts        # streamText({ system: SYSTEM_PROMPT, messages }) → toUIMessageStreamResponse
components/
  Chat.tsx                 # useChat chat UI (messages, streaming, composer, starters)
  ContextMeter.tsx         # the "how much is in context" pill
lib/triage/
  runbooks.ts              # ~18 runbooks (deliberately overlapping) + incident-archive generator
  policies.ts              # severity / SLA / escalation / tone / compliance + canary rules R1–R5
  context.ts              # assembles the ONE giant system prompt + CONTEXT_STATS
```

---

## Tuning the drift

- **More bloat → more drift:** raise `INCIDENTS_PER_RUNBOOK` in `lib/triage/context.ts`.
- **Less bloat (to contrast):** lower it, or temporarily trim `POLICY_SECTIONS` /
  the runbook list — useful to show "small context obeys the rules, big context drifts."

---

## Intentionally not done (yet)

This agent is **deliberately bloated** — do not "fix" it here. The fixes are the
next workshop beats:

- **Agent Skills + progressive disclosure** — retrieve/load only the runbook the
  situation needs; keep context small and the rules in view.
- **Evals** — regression cases that catch drift (e.g., "did it keep R1–R5?").
- **Context engineering** — summarize/trim history, separate stable policy from
  per-turn material.
