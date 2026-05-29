import {
  COMMUNICATION_TONE,
  COMPLIANCE,
  ESCALATION_MATRIX,
  GLOSSARY,
  HOUSE_RULES,
  SEVERITY_RUBRIC,
  SIGN_OFF_RULE,
  SLA_TIERS,
} from "./policies";
import { RUNBOOKS } from "./runbooks";

/**
 * Assemble the THIN system prompt.
 *
 * This is the "after" to issue-triage-2x's "before". 2x concatenated the ENTIRE
 * knowledge base — every runbook in full plus a 180-entry incident archive — into
 * one ~14k-token prompt re-sent every turn, and the volume buried the canary rules
 * R1–R5 until the model drifted.
 *
 * Here the prompt carries only the small, always-relevant stuff: the role, the
 * response contract (R1–R5), and the policies. The runbooks are NOT here — they
 * live as individual Agent Skills the model loads on demand via the `skill` tool
 * (see lib/triage/agent.ts), and the incident archive sits on disk for the `bash`
 * tool to grep. Same rules as 2x, but now uncrowded — so the model keeps them.
 */

// 🗂️ ────────────────────────────────────────────────────────────────────────
// WORKSHOP TODO — write the THIN prompt + the skill workflow (the procedure)
//
// This is the "after" to issue-triage-2x. 2x pasted the whole knowledge base into
// context and drifted. Here the prompt must stay SMALL and tell the model to fetch
// knowledge on demand. Two strings to write:
//
// 1) PREAMBLE — the role, PLUS the key idea that the runbooks are NOT in this
//    prompt: the model has a `skill` tool whose description lists every runbook
//    (id, area, owner, when-to-use); it loads only the 1–2 it needs. A full
//    incident archive lives on disk for the `bash` tool to grep.
//
// 2) SKILL_WORKFLOW — the per-turn procedure. Be explicit; gpt-5-mini will
//    otherwise answer from the one-line index without loading the body:
//      • Pick the SINGLE best runbook from the index (two only if it truly spans
//        two). Many runbooks mention "timeouts" — DIFFERENT problems, different
//        owners; disambiguate by area/symptoms, NEVER conflate.
//      • You MUST call skill("<rb-id>") to load it before answering; treat the
//        loaded text as authoritative.
//      • For precedent, grep the archive with bash (e.g. grep -i "RB-CHK-02" incidents.md).
//      • Apply ALL response rules R1–R5 (from the policies below) every turn.
//
// 💡 The lesson: the fix for drift is LESS context, not more reasoning. The
//    runbook bodies + 180 incidents stay OUT of this string.
// ─────────────────────────────────────────────────────────────────────────────
const PREAMBLE = "TODO: write the thin preamble (see the brief above).";

// 👆 See the WORKSHOP TODO above PREAMBLE for the full brief on this procedure.
const SKILL_WORKFLOW = "TODO: write the per-turn skill workflow (see the brief above).";

/** Incidents per runbook in the on-disk archive (NOT in the prompt; grep-able). */
export const INCIDENTS_PER_RUNBOOK = 10;

// Policy sections in order (counted for the context meter). These are small and
// always relevant, so they stay in the prompt — unlike the runbooks.
const POLICY_SECTIONS: Array<{ heading: string; body: string }> = [
  { heading: "SEVERITY RUBRIC", body: SEVERITY_RUBRIC },
  { heading: "SLA TIERS", body: SLA_TIERS },
  { heading: "ESCALATION MATRIX & CONTACTS", body: ESCALATION_MATRIX },
  { heading: "COMMUNICATION & TONE", body: COMMUNICATION_TONE },
  { heading: "COMPLIANCE & SAFETY", body: COMPLIANCE },
  { heading: "GLOSSARY", body: GLOSSARY },
];

function buildSystemPrompt(): string {
  const sections: string[] = [PREAMBLE, HOUSE_RULES];

  for (const p of POLICY_SECTIONS) {
    sections.push(`======== ${p.heading} ========\n${p.body}`);
  }

  sections.push(SIGN_OFF_RULE);
  sections.push(SKILL_WORKFLOW);

  return sections.join("\n\n");
}

/** The thin system prompt — built once at module load. */
export const SYSTEM_PROMPT = buildSystemPrompt();

const chars = SYSTEM_PROMPT.length;

/**
 * Stats for the UI's context meter. Same shape as 2x so the meter and page keep
 * working — but the meaning flips: runbooks and incidents are now AVAILABLE on
 * demand, not crammed into context. `chars`/`estTokens` describe only the thin
 * base prompt (~a few k), which is the headline contrast with 2x's ~14k.
 */
export const CONTEXT_STATS = {
  runbooks: RUNBOOKS.length,
  policies: POLICY_SECTIONS.length,
  incidents: RUNBOOKS.length * INCIDENTS_PER_RUNBOOK,
  chars,
  // ~4 chars per token is a fine "how big is this" gauge (not billing-accurate);
  // the meter prefers the model's REAL inputTokens once a turn completes.
  estTokens: Math.round(chars / 4),
};
