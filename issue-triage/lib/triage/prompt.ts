/**
 * 🎛️ THE TRIAGE "OPERATING SYSTEM" — its instructions.
 *
 * Deciding how the model must behave is the ENGINEER's job, not the coding
 * agent's. For v1 we (deliberately) cram all of that behavior into one big
 * prompt string — a textbook anti-pattern we'll feel the pain of later and fix
 * with Agent Skills. Right now it's a placeholder, so the agent will produce
 * garbage. Replace it.
 */

// 🎛️ ────────────────────────────────────────────────────────────────────────
// WORKSHOP TODO — write the triage system prompt
//
// Your prompt must make the model produce ONE strict JSON triage decision the
// React UI can render. Spell out, in plain English:
//
//   • ROLE: an issue-triage assistant for a SaaS product; reads ONE issue and
//     returns ONE structured decision rendered straight into a dashboard.
//   • WHAT TO DECIDE — every field the contract needs (keep these in lockstep
//     with lib/triage/schema.ts, the OTHER source of truth):
//       category, severity, affectedArea, summary, suggestedAction, ownerTeam,
//       needsHumanReview, confidence, evidence[]
//     …including the exact enum VALUES allowed for each, and how to map common
//     words to an affectedArea (payments/cart → checkout, login/session → auth…).
//   • TOOL POLICY: it has searchProductDocs / getRecentIncidents /
//     getComponentOwner (see lib/triage/tools.ts). Say WHEN to call them — e.g.
//     it MUST call getRecentIncidents before marking high/critical, and should
//     ground ownerTeam with getComponentOwner instead of guessing.
//   • SEVERITY POLICY: when is something low / medium / high / critical?
//   • OUTPUT CONTRACT: return ONLY one JSON object — no prose, no markdown, no
//     code fences — with EXACTLY the contract keys. Include one tiny valid example.
//   • SAFE DEFAULTS: if unsure, choose the safest values and set
//     needsHumanReview = true with low confidence.
//
// 💡 Two things to notice as you write it (we exploit both later):
//   1. You're describing the contract HERE in English *and* in Zod in schema.ts
//      — two sources of truth for one contract. That's a smell.
//   2. There is no prompt-injection policy yet. Leave it out for now; "break the
//      agent" (minute 100–120) is more fun when "ignore previous instructions"
//      still works.
// ─────────────────────────────────────────────────────────────────────────────
export const TRIAGE_SYSTEM_PROMPT =
  "TODO: write the triage system prompt (see the brief above). This placeholder " +
  "lets the app compile, but the agent will behave badly until you write it.";
