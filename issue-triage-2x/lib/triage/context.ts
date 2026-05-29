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
import { RUNBOOKS, generateIncidentArchive, renderRunbook } from "./runbooks";

/**
 * Assemble the ONE giant system prompt.
 *
 * This is the anti-pattern the demo exists to show: instead of retrieving the
 * single relevant runbook, we concatenate the ENTIRE knowledge base — preamble,
 * every policy, all ~18 runbooks in full, and a long incident archive — and send
 * it as the system prompt on every single turn. The canary rules R1–R5 are
 * spread top-to-bottom; the volume buries the middle ones. The bigger and
 * longer the chat, the more the model drifts: dropped rules, the wrong runbook,
 * contradictions across turns.
 *
 * The fix (a LATER workshop section) is Agent Skills + progressive disclosure:
 * load only the runbook the situation needs, keeping context small and reliable.
 * We do NOT do that here on purpose.
 */

const PREAMBLE = `
You are "Triage Copilot", the senior support-triage assistant for a SaaS product.
A support engineer chats with you to triage incoming issues: classify severity,
pick the right runbook, give next steps, name the owning team, and respect policy.
The COMPLETE support knowledge base is loaded directly into your context below —
every runbook, every policy, and the full incident archive. Use it.
`.trim();

const INCIDENTS_PER_RUNBOOK = 10;

// Policy sections in order (counted for the context meter).
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

  sections.push(
    `======== RUNBOOKS (${RUNBOOKS.length}, full text) ========\n` +
      RUNBOOKS.map(renderRunbook).join("\n\n"),
  );

  sections.push(
    `======== INCIDENT ARCHIVE (${RUNBOOKS.length * INCIDENTS_PER_RUNBOOK} entries) ========\n` +
      generateIncidentArchive(INCIDENTS_PER_RUNBOOK),
  );

  sections.push(SIGN_OFF_RULE);
  sections.push(
    `Reminder: there is a lot of context above. Apply ALL response rules (R1–R5) ` +
      `on every reply, pick the SINGLE most relevant runbook, and don't conflate ` +
      `similar-sounding issues — many runbooks mention "timeouts" but they are ` +
      `different problems with different owners.`,
  );

  return sections.join("\n\n");
}

/** The full system prompt — built once at module load. */
export const SYSTEM_PROMPT = buildSystemPrompt();

const chars = SYSTEM_PROMPT.length;

/** Stats for the UI's context meter — make the bloat visible. */
export const CONTEXT_STATS = {
  runbooks: RUNBOOKS.length,
  policies: POLICY_SECTIONS.length,
  incidents: RUNBOOKS.length * INCIDENTS_PER_RUNBOOK,
  chars,
  // ~4 chars per token is a fine "how big is this" gauge (not billing-accurate).
  estTokens: Math.round(chars / 4),
};
