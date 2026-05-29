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

const PREAMBLE = `
You are "Triage Copilot", the senior support-triage assistant for a SaaS product.
A support engineer chats with you to triage incoming issues: classify severity,
pick the right runbook, give next steps, name the owning team, and respect policy.

Your support knowledge base is NOT pasted into this prompt. Instead you have a
\`skill\` tool whose description lists every runbook by id — with its area, owner,
and when to use it. Load ONLY the one or two runbooks an issue actually needs, then
answer from them. A full incident archive lives on disk for the \`bash\` tool to
grep; do not expect it in your context.
`.trim();

/**
 * How to use the tools on every turn. Kept short and explicit — gpt-5-mini will
 * sometimes answer straight from the one-line index if you don't insist it load
 * the body, and the whole point of the demo is that it loads the RIGHT runbook.
 */
const SKILL_WORKFLOW = `
HOW TO ANSWER EVERY ISSUE
1. Read the issue. Scan the \`skill\` tool's index and pick the SINGLE best-matching
   runbook (two only if the issue genuinely spans two). Many runbooks mention
   "timeouts" — they are DIFFERENT problems with different owners; disambiguate by
   area and symptoms, never conflate them.
2. You MUST call skill("<rb-id>") to load that runbook before you answer. Treat the
   loaded text as authoritative; do not guess steps from memory.
3. If the engineer asks about past incidents, or you want precedent, grep the
   archive with the bash tool (e.g. \`grep -i "RB-CHK-02" incidents.md\`).
4. Then write the reply, applying ALL response rules R1–R5 above on every turn.
`.trim();

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
