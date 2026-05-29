import { TriageResultSchema, type TriageResult } from "./schema";

/**
 * The contract boundary — now on the client.
 *
 * The agent streams its decision as JSON *text* (see lib/triage/agent.ts for why
 * that's deliberate in v1). The instant before that text becomes a rendered
 * card, we validate it here: parse the JSON, then check it against the Zod
 * contract. If either step fails, the UI shows an honest error instead of
 * rendering a bad shape. This is the workshop's line — "the model's output
 * becomes UI state, so validate it at that boundary."
 */
export type ParseResult =
  | { ok: true; data: TriageResult }
  | { ok: false; error: string; raw: unknown; issues?: unknown };

export function parseTriageText(text: string): ParseResult {
  const parsed = extractJson(text);
  if (parsed === undefined) {
    return { ok: false, error: "Model did not return valid JSON.", raw: text };
  }

  const validated = TriageResultSchema.safeParse(parsed);
  if (validated.success) {
    return { ok: true, data: validated.data };
  }
  return {
    ok: false,
    error: "Model JSON did not match the TriageResult contract.",
    raw: parsed,
    issues: validated.error.issues,
  };
}

/**
 * Deliberately naive JSON extraction (unchanged from v1): try to parse the whole
 * string, otherwise grab the outermost { ... } block. A real product would use a
 * structured-output API instead of fishing JSON out of text — a later step.
 */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return undefined;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}
