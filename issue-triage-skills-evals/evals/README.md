# Evals — grading the triage agent against its contract

This directory evaluates the **real** skills triage agent (the same `ToolLoopAgent`
the app uses) against the **R1–R5 canary contract**. It's the workshop's "evals"
beat: an eval is just *a dataset of inputs + scorers that grade the output*, run
repeatedly so you catch regressions.

## The two kinds of scorer (the whole idea)

- **Deterministic / code** (`evals/scorers.ts`) — cheap, fast, no model call. The
  canary rules are *format* rules, so they're plain code:
  - `R1 · Refs line` — ends with `Refs: [RB-…]`
  - `R2 · plain prose` — no markdown headers/tables/bullets
  - `R3 · SLA stated` — states a first-response SLA in minutes
  - `R5 · sign-off` — ends with `— Triage Copilot`
  - `R4 · refund guarded` — refunds > $50 routed to finance approval
  - `Right runbook` — the Refs line cites the runbook this issue should use
- **LLM-as-judge** (`slaValueCorrect`) — for what code can't check cheaply: is the
  stated SLA the *right number*? (Business P1 = 60, not the runbook's "30 min"
  literal.) This is the scorer that catches the drift on low reasoning effort.

## Run it

```bash
npm install
npm run build:skills        # if skills/ is missing (the agent reads them off disk)
cp .env.example .env.local  # add your OPENAI_API_KEY

npm run eval        # evalite WATCH + dashboard → http://localhost:3006 (re-runs on save)
npm run eval:run    # run once, print the table, exit (use in CI)
```

> Each run makes **real OpenAI calls**: the task runs the agent (which calls the
> model + loads skills), and the judge calls a model to grade. `OPENAI_MODEL`
> drives the agent; `OPENAI_JUDGE_MODEL` (default `gpt-5-mini`) drives the judge.

## The A/B demo (evals catch the regression)

The agent reads `OPENAI_REASONING_EFFORT` (see `lib/triage/agent.ts`). Flip it and
re-run the *same* eval:

```bash
npm run eval:run                                   # default reasoning — rules hold
OPENAI_REASONING_EFFORT=minimal npm run eval:run   # strip the safety net
```

On `minimal`, the **`SLA value correct (judge)`** scorer fails on the Business-P1
cases — the agent grabs the runbook's "30 min" literal instead of computing 60 from
the SLA matrix. The deterministic canary checks (R1/R2/R3/R5, right runbook) stay
green. Lesson: *less context fixed the format/attention failures; the SLA value is a
reasoning task, so the eval still catches it.* Wire `scoreThreshold` in
`evalite.config.ts` to make this a CI gate (exit non-zero below the threshold).

## Notes

- `expected` values encode **your** policy (severity → SLA). Ambiguous cases (e.g.
  "login timing out for several users" — P0 or P1?) surface as a judge mismatch.
  That's a feature: it forces you to tighten the rubric or accept a range.
- `evalite.config.ts` raises `testTimeout` to 180s (agent turns are slow) and caps
  `maxConcurrency` (rate limits).
- To also eval `issue-triage-2x` for a side-by-side, point a copy of this at its
  `/api/chat` (it has no in-process agent to import — it's single-shot `streamText`).
