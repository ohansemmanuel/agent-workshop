# 🛠️ Workshop: From Big Prompts to Reliable React Agents

**You are on the `todo` branch — the starter.** The apps here are deliberately
*incomplete*: the plumbing is wired, but the pieces that are an **engineer's job**
have been carved out and replaced with guidance.

> The thesis of the whole workshop: **a coding agent can write the code; the
> engineer designs the agent's _operating system_ — its instructions, tools,
> contracts, procedures, evals, and safe UI states.** Those are exactly the
> pieces you'll build here.

- 🌱 **`todo` branch** = what you build (this branch).
- ✅ **`master` branch** = the finished reference solution. Stuck? Peek:
  `git show master:issue-triage/lib/triage/schema.ts`

## How to work it

1. Pick an app below (they follow the workshop's running order).
2. Open it and search for **`WORKSHOP TODO`** (and **`BUILD BY HAND`** in
   `tiny-agent`). Each one explains *what* to build and *why* — in instructor voice.
3. Build it. The **`tiny-agent`** loop you write **by hand** (that's the lesson).
   For the rest, this is a great place to **point your coding agent at the TODO**
   and direct it — you own the design decision; let it write the code.
4. Run the app, see it work, move on.

> 💡 The branch mostly compiles. The one intentional exception is `issue-triage`:
> its contract (`schema.ts`) is empty, so `TriageResultCard.tsx` won't type-check
> until you define it. Those red squiggles **are** the to-do list.

Every app needs an OpenAI key — copy `.env.example` → `.env.local` and add
`OPENAI_API_KEY` (the `tiny-agent` reads it from your shell env).

---

## The arc — one app per beat

| ⏱️ | App | The beat | What **you** build | Run |
|----|-----|----------|--------------------|-----|
| 30–50 | `tiny-agent` | The smallest agent, **by hand** | the agent **loop** + the **tool dispatch** | `npm run agent` |
| 50–90 | `issue-triage` | First real Next.js feature + contract | the **prompt**, the **contract** (Zod), the **validation boundary** | `npm run dev` |
| 100–120 | `issue-triage-2x` | Watch it **drift** | _nothing — observe & break_ | `npm run dev` |
| 120–150 | `issue-triage-skills` | **Agent Skills** / progressive disclosure | the skill **index line**, the **procedure**, the **skill+bash wiring** | `npm run build:skills && npm run dev` |
| 150–170 | `issue-triage-skills-evals` | **Evals** | the **scorers** + the **dataset** | `npm run eval` |

---

### 🧩 `tiny-agent` — an agent is a loop around an LLM call

Build it **by hand** so you never forget what the SDK does for you later. In
`tiny-agent.ts`:

- `runAgent()` — the **loop**: call the model → run any tool calls it requests →
  feed results back → repeat until it answers (with a hard step cap).
- `runTool()` — the **dispatch**: match the requested tool, run it, return its
  result. _The model only requests; your code executes._

```bash
cd tiny-agent && npm install
npm run agent                       # uses the built-in sample question
npm run agent -- "What happens at minute 75?"
```

### 🎛️📐🚦 `issue-triage` — instructions, contract, safe UI states

The "first real feature." Three engineer-owned pieces (the rest — the SDK route,
the agent wiring, the tools, the UI shell — are done for you):

1. `lib/triage/prompt.ts` — 🎛️ the **system prompt** (the model's instructions).
2. `lib/triage/schema.ts` — 📐 the **output contract** (Zod). *"The model's output
   becomes UI state."* Defining this lights up `TriageResultCard`.
3. `lib/triage/parse.ts` — 🚦 the **validation boundary**: validate the model's
   text against the contract before it renders, so the UI has only **safe states**.

```bash
cd issue-triage && npm install && npm run dev      # http://localhost:3000
```

### 🧭 `issue-triage-2x` — the cautionary "before"

**Nothing to build.** This crams the entire knowledge base into one giant system
prompt. Run it, push it hard, and watch it **drift** — dropped rules, wrong
runbook, contradictions. (Want to force the drift? Set
`OPENAI_REASONING_EFFORT=minimal` in `.env.local`.) You fix this next door.

```bash
cd issue-triage-2x && npm install && npm run dev
```

### 🗂️ `issue-triage-skills` — progressive disclosure

The "after." Keep the prompt **thin** and load knowledge **on demand**. Build,
roughly in this order:

1. `scripts/build-skills.ts` → `descriptionFor()` — 🗂️ the one-line **skill index**
   entry (what lets the model pick the right runbook *without* reading any body).
   Then **generate the pack** (it's intentionally absent on this branch):
   `npm run build:skills`.
2. `lib/triage/context.ts` → the **thin preamble** + **skill workflow** (the
   per-turn procedure: load the ONE right runbook, don't conflate "timeouts").
3. `lib/triage/agent.ts` → `buildAgent()` — wire the **`skill` + `bash`** tools and
   mount the incident archive as a grep-able file (not in the prompt).

```bash
cd issue-triage-skills && npm install
npm run build:skills      # generates skills/ from your descriptionFor()
npm run dev               # http://localhost:3000 — watch the activity log + meter
```

### 🧪 `issue-triage-skills-evals` — test the agent like a product

The skills agent here is **already working** — your job is to grade it. An eval =
a **dataset** of inputs + **scorers** that grade the output, run repeatedly.

1. `evals/scorers.ts` — the **scorers**: deterministic canary checks (R1–R5) +
   one **LLM-as-judge** (is the SLA the *right number*?). All stubbed to return 0.
2. `evals/triage.eval.ts` — the **dataset** (`{ input, expected }` cases that
   encode what "good" looks like). One worked example is provided per block.

```bash
cd issue-triage-skills-evals && npm install
npm run eval        # evalite watch + dashboard → http://localhost:3006
npm run eval:run    # run once, print the table, exit (CI)
```

> ⚠️ Evals make **real OpenAI calls** (the agent runs, and the judge grades).
> The **A/B finale**: once your scorers pass on default reasoning, run
> `OPENAI_REASONING_EFFORT=minimal npm run eval:run` and watch the SLA-value judge
> catch the drift while the deterministic checks stay green.
