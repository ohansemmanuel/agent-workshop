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
  // 🚦 ───────────────────────────────────────────────────────────────────────
  // WORKSHOP TODO — validate the model's output at the UI boundary
  //
  // The agent streams its decision as JSON *text*. The instant before that text
  // becomes a rendered card, PROVE it's safe:
  //   1. Pull JSON out of the text → extractJson(text) (provided below).
  //      None? return { ok: false, error: "Model did not return valid JSON.", raw: text }
  //   2. Check it against the contract → TriageResultSchema.safeParse(parsed):
  //      • success → return { ok: true, data: <the parsed, typed result> }
  //      • failure → return { ok: false, error: "…didn't match the contract",
  //                           raw: parsed, issues: <validated.error.issues> }
  //
  // 💡 This is what makes "safe UI states" real: the component renders the card
  //    ONLY on { ok: true } and shows an honest error on { ok: false } — it never
  //    has to defend against a malformed shape. Return data; don't throw.
  // ───────────────────────────────────────────────────────────────────────────
  return {
    ok: false,
    error: "TODO: implement parseTriageText (see the brief above).",
    raw: text,
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
