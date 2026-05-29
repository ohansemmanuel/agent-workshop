// setup-env MUST be first: it loads .env.local into process.env before the agent
// module (imported below) reads OPENAI_* at module load.
import "./setup-env";

import { evalite } from "evalite";

import { getTriageAgent } from "../lib/triage/agent";
import {
  citedExpectedRunbook,
  plainProse,
  refsPresent,
  refundGuarded,
  signedOff,
  slaStated,
  slaValueCorrect,
  type Expected,
} from "./scorers";

/**
 * The task under eval: run the REAL skills agent (same ToolLoopAgent the app uses)
 * on one issue and return its final text. `generate` runs the whole tool loop —
 * pick a runbook, `skill(...)` to load it, maybe `bash`-grep incidents, compose —
 * exactly like a live turn, just non-streaming.
 */
async function triage(prompt: string): Promise<string> {
  const agent = await getTriageAgent();
  const result = await agent.generate({ prompt });
  return result.text;
}

// Plans are pinned in the prompts so the correct SLA is unambiguous:
// Business P1 = 60 min, P2 = 120 min (per the SLA matrix in lib/triage/policies.ts).
evalite<string, string, Expected>("Triage · canary rules R1–R3, R5 + right runbook", {
  data: () => [
    {
      input:
        "A Business-plan customer on mobile Safari reports the checkout button does nothing. Triage it.",
      expected: { runbook: "RB-CHK-01", slaMinutes: 60 },
    },
    {
      input: "Several Business-plan users say login keeps timing out. Triage it.",
      expected: { runbook: "RB-AUTH-01", slaMinutes: 60 },
    },
    {
      input:
        "A Business-plan customer's invoices are missing from the billing page. Triage it.",
      expected: { runbook: "RB-BIL-01", slaMinutes: 120 },
    },
    {
      input:
        "A Business-plan customer's API integration is suddenly getting 429s. Triage it.",
      expected: { runbook: "RB-API-02", slaMinutes: 120 },
    },
  ],
  task: triage,
  scorers: [
    refsPresent, // R1
    plainProse, // R2
    slaStated, // R3 (format: an SLA in minutes was stated)
    signedOff, // R5
    citedExpectedRunbook, // progressive disclosure picked the right runbook
    slaValueCorrect, // judge: the SLA VALUE is right (catches the minimal-effort drift)
  ],
});

// R4 is its own case — refunds over $50 must route to finance, not be promised.
evalite<string, string, Expected>("Triage · refund policy R4 (>$50 needs approval)", {
  data: () => [
    {
      input:
        "A Business-plan customer wants a $250 refund for a duplicate charge. Can I just issue it?",
      expected: { runbook: "RB-PAY-01", slaMinutes: 120 },
    },
  ],
  task: triage,
  scorers: [refundGuarded, refsPresent, citedExpectedRunbook, signedOff],
});
