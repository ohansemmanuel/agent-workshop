# AI Issue Triage Assistant

Workshop demo for **"From Big Prompts to Reliable React Agents"** —
section _"Beyond Hello World."_

The tiny CLI agent showed the raw loop: **model → tool call → tool result →
final answer**. This app puts that exact loop behind a real product surface: a
React form, a Next.js API route, the Vercel AI SDK (v6, streaming via
`useChat`), local tools, a Zod contract, a live agent-activity timeline, and a
rendered result card.

> The moment an agent's output becomes React state, reliability stops being
> theoretical. If the model returns the wrong shape, the UI breaks. If it
> misuses a tool, the product recommends the wrong action. If it follows
> injected content, the user sees bad behavior.

---

## What this demo teaches

- The AI SDK **abstracts the loop we built by hand** (`ToolLoopAgent` +
  `stepCountIs`) and **streams it to the UI** (`useChat`) — but it does **not**
  remove the engineering responsibility.
- An agent feature is `model + instructions + tools + state + loop`, now wired
  to a typed UI contract.
- Where v1 reliability comes from: **validating the model's output at the
  boundary** before it ever becomes UI state.
- Why "one big prompt + a schema + hope" is enough for a demo and **not enough
  for a product** — which sets up the Skills + evals sections that follow.

### From the tiny agent to this

`tiny-agent.ts` is ~380 lines — the agent loop, a raw `fetch`, response parsing,
and type guards, all written by hand. This app is the **same loop** (`model →
tool call → tool result → repeat`) with the plumbing deleted and the product
engineering added. It reads as two layers.

**Layer 1 — what the AI SDK deletes.** The loop is identical; the ceremony is gone.

| `tiny-agent.ts` — by hand                                 | This app — Vercel AI SDK v6                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `fetch("…/responses")` + auth header + body (`callModel`) | `openai(MODEL)` inside a `ToolLoopAgent`                                        |
| `for (step ≤ maxSteps)` driving the loop (`runAgent`)     | `new ToolLoopAgent({ … })` + `stopWhen: stepCountIs(5)`                         |
| `previous_response_id` + `store: true` state threading    | the SDK + `useChat` manage step + message state                                 |
| tools as raw JSON Schema literals                         | `tool({ inputSchema: z.object(…), execute })`                                   |
| `runTool()` name-switch + `safeJsonParse(args)`           | the SDK validates args, then calls `execute`                                    |
| `isFunctionCallItem` / `extractOutputText` parsing        | typed `message.parts` (text + `tool-*`)                                         |
| `console.log("MODEL REQUESTED TOOL" / "TOOL RESULT")`     | streamed `tool-*` parts → a live `<AgentActivity>` timeline                     |
| reading the raw HTTP response by hand                     | `createAgentUIStreamResponse` (server) + `useChat` (client) own the wire format |
| `throw "Possible loop"` after `maxSteps`                  | `stepCountIs(5)` is the cap                                                     |

The SDK didn't invent anything — it's the exact cycle from the tiny agent. The
route is three lines (`createAgentUIStreamResponse({ agent, uiMessages })`); the
client is one hook (`useChat`). Even the tiny agent's `console.log` step-trace
survives — now as a live, typed activity timeline in the UI.

**Layer 2 — what the SDK does _not_ do.** This is the "near-production" work, and
it's the point of the workshop: the SDK gives you the loop; reliability you still
engineer.

- **An output contract** — `TriageResultSchema`. The agent streams its decision
  as JSON _text_; `parseTriageText` (`extractJson` + `safeParse`) checks it at the
  UI boundary, the instant before it becomes a card (`lib/triage/parse.ts`).
- **Safe UI states** — empty / live agent activity / error (with the raw model
  output + schema issues) / success card. The card renders _only_ from a
  validated result.

Streaming changes the transport, not the lesson: there's no HTTP `422` to lean on
mid-stream, so the contract is enforced on the client right before render — never
render unvalidated model output. What's _still_ missing is deliberate (see
[Known weaknesses](#known-weaknesses-intentionally-left-in-v1)) and sets up the
rest of the day: JSON fished from text, the contract duplicated in prose, and no
injection policy.

---

## Architecture

```
React form + useChat (IssueTriageDemo)
  ↓ POST /api/triage  { messages }
createAgentUIStreamResponse({ agent: triageAgent })   ← ToolLoopAgent, stopWhen: stepCountIs(5)
  ↓ streams a UI message: tool-call / tool-result parts + JSON text
useChat surfaces message.parts to the client
  ├─ tool-* parts → <AgentActivity> live timeline
  └─ text part (the JSON) ↓ once the stream completes
parseTriageText(): extractJson() + TriageResultSchema.safeParse()
  ↓ valid
React renders <TriageResultCard>
```

### Project structure

```
app/
  layout.tsx
  page.tsx
  globals.css
  api/triage/route.ts      # 3-line route: createAgentUIStreamResponse(triageAgent)
components/
  IssueTriageDemo.tsx      # useChat form + states + examples
  AgentActivity.tsx        # live tool-call timeline (from message.parts)
  TriageResultCard.tsx     # renders a validated TriageResult
lib/triage/
  agent.ts                 # ToolLoopAgent + InferAgentUIMessage type
  schema.ts                # Zod contract (TriageResultSchema + type)
  parse.ts                 # client-side contract boundary (extractJson + safeParse)
  tools.ts                 # three fake, deterministic local tools
  prompt.ts                # the (deliberately huge) system prompt
.agents/skills/ai-sdk/     # the AI SDK skill this app was built with
evals/                     # placeholder — eval harness comes later
```

---

## Stack

- Next.js (App Router) · React 19 · TypeScript
- Vercel AI SDK **v6** (`ai`) — `ToolLoopAgent` + `@ai-sdk/react` (`useChat`) — with `@ai-sdk/openai`
- Streaming UI: tool calls and the result stream live to the client
- Zod for the output contract
- Tailwind CSS v4 for styling
- **Local fake tools only** — no real Linear/GitHub/Sentry, no MCP, no database

---

## Setup

```bash
cd issue-triage
npm install
```

### Set your OpenAI key

Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional — defaults to gpt-5-mini. Set any model your account can access.
OPENAI_MODEL=gpt-5-mini
```

### Run locally

```bash
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build       # production build (also type-checks)
npm run typecheck   # tsc --noEmit
```

---

## Example inputs

Click a chip in the UI, or paste one of these:

| Type                 | Input                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| **Bug (happy path)** | The checkout button does nothing on mobile Safari after the latest deploy. |
| **Feature request**  | Can we add dark mode to the billing page?                                  |
| **Support issue**    | A customer says invoices are missing from their dashboard.                 |
| **Ambiguous**        | Something feels weird on the settings page.                                |

The `checkout` area has a seeded **active incident (INC-103)**, so the happy-path
bug should drive the model to higher severity + `needsHumanReview`.

---

## Known weaknesses (intentionally left in v1)

This version works the way a lot of real AI features ship: one big prompt, some
tools, a schema, and hope. We are leaving the cracks visible on purpose.

- **Product behavior is buried in one large prompt** (`lib/triage/prompt.ts`).
- **The JSON contract is described twice** — once in Zod, once in English — so
  they can silently drift apart.
- **The tool-use policy is informal** — prose in the prompt, not enforced.
- **No prompt-injection policy yet** — try the injection example and watch.
- **No Agent Skills yet** — behavior is not packaged, versioned, or reusable.
- **No evals yet** — nothing proves a change didn't make triage worse.
- **No versioning yet** — "improving the prompt" is an untracked edit.
- **Output is JSON fished from text** — the agent returns its decision as text
  and we parse it, instead of using the SDK's structured-output API
  (`Output.object`). Upgrading this is a later step.
- **Validation catches malformed output but does not prove the recommendation is
  good** — a confidently-wrong-but-valid triage still renders.

---

## Where this goes next (workshop sections)

1. **Break the feature intentionally** — output drift, tool misuse, prompt
   injection, invalid UI states.
2. **Refactor into an Agent Skill** — lift the prompt into a Skill pack with an
   output contract, tool policy, injection policy, and validation. See
   `.agents/skills/react-triage-agent/`.
3. **Add lightweight evals** — regression cases so behavior changes are
   reviewable. See `evals/`.
