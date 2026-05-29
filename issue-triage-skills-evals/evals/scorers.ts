import "./setup-env";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { createScorer } from "evalite";
import { z } from "zod";

/**
 * What "good" looks like for a triage case. The dataset attaches this to each
 * input; scorers read it via `expected`.
 */
export type Expected = {
  /** The runbook the agent should rely on (and cite in its Refs line). */
  runbook: string;
  /** The correct first-response SLA in minutes (per the SLA matrix + plan). */
  slaMinutes: number;
};

// Pull the contents of the trailing `Refs: [ ... ]` line, or null if absent.
function refsLine(text: string): string | null {
  const m = text.match(/^Refs:\s*\[(.*)\]\s*$/m);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Deterministic scorers — the canary CONTRACT (R1, R2, R3, R5) + right runbook.
// Cheap, fast, no model call. These are just code: the rules are checkable.
// ---------------------------------------------------------------------------

export const refsPresent = createScorer<string, string, Expected>({
  name: "R1 · Refs line",
  description: "Reply ends with a `Refs: [RB-…]` line",
  scorer: ({ output }) => (refsLine(output) !== null ? 1 : 0),
});

export const citedExpectedRunbook = createScorer<string, string, Expected>({
  name: "Right runbook",
  description: "The Refs line cites the runbook this issue should use",
  scorer: ({ output, expected }) => {
    const refs = (refsLine(output) ?? "").toUpperCase();
    return expected && refs.includes(expected.runbook.toUpperCase()) ? 1 : 0;
  },
});

export const plainProse = createScorer<string, string, Expected>({
  name: "R2 · plain prose",
  description: "No markdown headers, tables, or bullet lists",
  scorer: ({ output }) => {
    const hasMarkdown =
      /^#{1,6}\s/m.test(output) || // headers
      /^\s*[-*]\s/m.test(output) || // bullet lists
      /\|.*\|/m.test(output); // tables
    return hasMarkdown ? 0 : 1;
  },
});

export const slaStated = createScorer<string, string, Expected>({
  name: "R3 · SLA stated",
  description: "States a first-response SLA target in minutes",
  scorer: ({ output }) => (/\b\d+\s*(?:minutes?|min)\b/i.test(output) ? 1 : 0),
});

export const signedOff = createScorer<string, string, Expected>({
  name: "R5 · sign-off",
  description: "Signs off with “— Triage Copilot”",
  scorer: ({ output }) => (output.includes("— Triage Copilot") ? 1 : 0),
});

export const refundGuarded = createScorer<string, string, Expected>({
  name: "R4 · refund guarded",
  description: "Refunds over $50 routed to finance approval (not promised outright)",
  scorer: ({ output }) => {
    const o = output.toLowerCase();
    return o.includes("finance") && (o.includes("approval") || o.includes("approve"))
      ? 1
      : 0;
  },
});

// ---------------------------------------------------------------------------
// LLM-as-judge — for what code can't check cheaply: is the SLA VALUE correct?
// (R3 deterministic only checks that *an* SLA-in-minutes was stated; this checks
// it's the RIGHT number — e.g. Business P1 = 60, not the runbook's "30 min"
// literal. This is the scorer that catches the drift on minimal reasoning effort.)
// Note: judging with the same model family is fine for a demo; in production you'd
// prefer a stronger/different judge model — override with OPENAI_JUDGE_MODEL.
// ---------------------------------------------------------------------------

const JUDGE_MODEL = process.env.OPENAI_JUDGE_MODEL ?? "gpt-5-mini";

export const slaValueCorrect = createScorer<string, string, Expected>({
  name: "SLA value correct (judge)",
  description: "LLM judge: is the stated first-response SLA the correct number of minutes?",
  scorer: async ({ input, output, expected }) => {
    if (!expected) return { score: 0, metadata: { reason: "no expected value" } };

    const { object } = await generateObject({
      model: openai(JUDGE_MODEL),
      schema: z.object({
        statedMinutes: z
          .number()
          .nullable()
          .describe("the first-response SLA the reply stated, in minutes; null if none"),
        correct: z.boolean(),
        reason: z.string(),
      }),
      prompt: [
        "A support-triage agent answered this issue:",
        `ISSUE: ${input}`,
        "",
        "REPLY:",
        '"""',
        output,
        '"""',
        "",
        `The CORRECT first-response SLA for this issue is ${expected.slaMinutes} minutes.`,
        "Did the reply state that first-response SLA target? Accept equivalent phrasings",
        '("1 hour" = 60 minutes, "2 business hours" = 120 minutes). Set correct=true ONLY',
        `if the stated first-response SLA equals ${expected.slaMinutes} minutes.`,
      ].join("\n"),
    });

    return { score: object.correct ? 1 : 0, metadata: object };
  },
});
