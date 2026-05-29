import { z } from "zod";

/**
 * The triage contract.
 *
 * This single schema is the boundary between the model and our React UI.
 * Whatever the model returns must parse into this shape, or the UI does not
 * render it. In the workshop this is the line we keep coming back to:
 *
 *   "In React, the model's output becomes UI state."
 *
 * Note (intentional v1 weakness): this contract is ALSO described in English
 * inside TRIAGE_SYSTEM_PROMPT. Two sources of truth for one contract is a smell
 * we will fix later when we refactor into an Agent Skill.
 */
export const TriageResultSchema = z.object({
  category: z.enum(["bug", "feature", "support", "unknown"]),

  severity: z.enum(["low", "medium", "high", "critical"]),

  summary: z.string().min(1).max(240),

  affectedArea: z.enum([
    "checkout",
    "billing",
    "auth",
    "dashboard",
    "settings",
    "unknown",
  ]),

  ownerTeam: z.enum(["payments", "platform", "growth", "support", "unknown"]),

  suggestedAction: z.string().min(1).max(300),

  needsHumanReview: z.boolean(),

  confidence: z.number().min(0).max(1),

  evidence: z
    .array(
      z.object({
        source: z.enum(["docs", "incidents", "ownership", "user_report"]),
        note: z.string().max(200),
      }),
    )
    .max(3),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;
