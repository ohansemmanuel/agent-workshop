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
// (Handy for R1 and the "right runbook" scorer.)
function refsLine(text: string): string | null {
  const m = text.match(/^Refs:\s*\[(.*)\]\s*$/m);
  return m ? m[1] : null;
}

// 🧪 ────────────────────────────────────────────────────────────────────────
// WORKSHOP TODO — write the scorers (this file IS the eval)
//
// An eval = a dataset of inputs + SCORERS that grade the output. Each scorer
// returns a number in [0, 1] (or { score, metadata }). There are TWO kinds, and
// the whole lesson is knowing which to reach for:
//
//   • DETERMINISTIC / code — cheap, fast, no model call. The canary rules R1–R5
//     are FORMAT rules, so they're just code (string checks / regex). Do these first.
//   • LLM-AS-JUDGE — for what code can't check cheaply (is the SLA the RIGHT
//     number?). Call a model with generateObject + a zod schema, and grade.
//
// Every scorer below is stubbed to return 0, so the dashboard shows ALL of them
// failing until you implement them — that's your signal. Keep each `name` /
// `description` (they're the labels in the evalite UI); fill in the bodies.
// `refsLine(output)` and `expected` (typed Expected) are your friends.
// ─────────────────────────────────────────────────────────────────────────────

export const refsPresent = createScorer<string, string, Expected>({
  name: "R1 · Refs line",
  description: "Reply ends with a `Refs: [RB-…]` line",
  // TODO(R1): 1 if the reply has a trailing `Refs: [ ... ]` line, else 0.
  //           (Hint: refsLine(output) !== null.)
  scorer: () => 0,
});

export const citedExpectedRunbook = createScorer<string, string, Expected>({
  name: "Right runbook",
  description: "The Refs line cites the runbook this issue should use",
  // TODO: 1 if the Refs line includes expected.runbook (case-insensitive), else 0.
  //       This is how you check progressive disclosure picked the RIGHT runbook.
  scorer: () => 0,
});

export const plainProse = createScorer<string, string, Expected>({
  name: "R2 · plain prose",
  description: "No markdown headers, tables, or bullet lists",
  // TODO(R2): 0 if the output has markdown headers (^#), bullet lists (^- / ^*),
  //           or tables (| … |); else 1.
  scorer: () => 0,
});

export const slaStated = createScorer<string, string, Expected>({
  name: "R3 · SLA stated",
  description: "States a first-response SLA target in minutes",
  // TODO(R3): 1 if the output states an SLA in minutes
  //           (e.g. /\b\d+\s*(?:minutes?|min)\b/i), else 0.
  //           FORMAT only — whether the NUMBER is right is judged below.
  scorer: () => 0,
});

export const signedOff = createScorer<string, string, Expected>({
  name: "R5 · sign-off",
  description: "Signs off with “— Triage Copilot”",
  // TODO(R5): 1 if the output includes "— Triage Copilot", else 0.
  scorer: () => 0,
});

export const refundGuarded = createScorer<string, string, Expected>({
  name: "R4 · refund guarded",
  description: "Refunds over $50 routed to finance approval (not promised outright)",
  // TODO(R4): 1 only if the reply routes the refund to finance approval (e.g.
  //           mentions "finance" AND "approval"/"approve") and does NOT promise
  //           the refund outright; else 0.
  scorer: () => 0,
});

// ── LLM-as-judge ─────────────────────────────────────────────────────────────
// R3 above only checks that *an* SLA-in-minutes was stated. THIS checks the VALUE
// is right (Business P1 = 60, not a runbook's "30 min" literal) — the scorer that
// catches the drift on minimal reasoning effort. Some things only a model can grade.
const JUDGE_MODEL = process.env.OPENAI_JUDGE_MODEL ?? "gpt-5-mini";

export const slaValueCorrect = createScorer<string, string, Expected>({
  name: "SLA value correct (judge)",
  description: "LLM judge: is the stated first-response SLA the correct number of minutes?",
  // 🧪 TODO — implement the LLM-as-judge:
  //   1. If !expected → return { score: 0, metadata: { reason: "no expected value" } }.
  //   2. const { object } = await generateObject({
  //        model: openai(JUDGE_MODEL),
  //        schema: z.object({
  //          statedMinutes: z.number().nullable(),  // the SLA the reply stated, or null
  //          correct: z.boolean(),
  //          reason: z.string(),
  //        }),
  //        prompt: <give the judge the ISSUE (input), the REPLY (output), and the
  //                 CORRECT SLA (expected.slaMinutes); ask if the reply stated that
  //                 SLA. Accept equivalents ("1 hour" = 60, "2 business hours" = 120);
  //                 correct=true ONLY if the stated SLA equals expected.slaMinutes>,
  //      });
  //   3. return { score: object.correct ? 1 : 0, metadata: object };
  //   (openai, generateObject, and z are already imported above.)
  scorer: async () => ({
    score: 0,
    metadata: { reason: "TODO: implement the SLA-value judge" },
  }),
});
