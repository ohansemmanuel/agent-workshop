/**
 * Generate the skill pack from the runbook corpus.
 *
 * This is the heart of the "after" demo. issue-triage-2x rendered ALL 18 runbooks
 * inline into one giant system prompt. Here we render each runbook to its OWN
 * `skills/<rb-id>/SKILL.md` instead — a self-contained Agent Skill the model can
 * load on demand via Vercel's bash-tool, one at a time.
 *
 * Each SKILL.md is:
 *   - YAML frontmatter: `name` (the runbook id, lowercased) + `description`
 *     (title + area + owner + "Use when:" keywords). The bash-tool skill loader
 *     auto-builds an index from these — that single line per skill is the only
 *     thing always in context. The model reads the index, then loads just the
 *     1–2 bodies it actually needs.
 *   - Body: the exact same text issue-triage-2x crammed inline, via the shared
 *     `renderRunbook()`. One source of truth (`RUNBOOKS`); the skills are derived.
 *
 * Re-runnable and idempotent: `npm run build:skills`. Commit the result so the
 * skills are inspectable in the workshop and present on disk at runtime (the
 * skill loader reads SKILL.md from disk).
 *
 * 🚧 ON THE `todo` BRANCH: the generated skills/ folder is intentionally ABSENT
 * and descriptionFor() below is a stub — generating the skill pack is YOUR job.
 * Implement descriptionFor, then run `npm run build:skills` to create skills/.
 * (Heads up: main() wipes skills/ before regenerating, so a broken descriptionFor
 * writes a broken index. Compare against the reference on master, e.g.
 *   git show master:issue-triage-skills/skills/rb-chk-01/SKILL.md )
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RUNBOOKS, renderRunbook, type Runbook } from "../lib/triage/runbooks";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(SCRIPT_DIR, "..", "skills");

/** The skill's directory name and `skill("…")` name: the runbook id, lowercased. */
function slugFor(rb: Runbook): string {
  return rb.id.toLowerCase();
}

/**
 * The one line that lives in the always-on skill index. It must let the model
 * pick the right runbook WITHOUT loading any bodies, so it carries the title,
 * area, owner, and the keywords as a "Use when:" hint. (JSON.stringify gives a
 * valid YAML double-quoted scalar — safe for the colons and commas.)
 */
function descriptionFor(rb: Runbook): string {
  // 🗂️ ──────────────────────────────────────────────────────────────────────
  // WORKSHOP TODO — write the skill's INDEX LINE (the heart of the "after")
  //
  // bash-tool builds an always-on index from each skill's frontmatter
  // `description` — one line per runbook, e.g.
  //     skill("rb-chk-01"): <what you return here>
  // The model reads ONLY that index, then loads the 1–2 bodies it needs. So this
  // single line is what lets it pick the RIGHT runbook WITHOUT reading any body.
  //
  // Make it discriminating — pack in what separates this runbook from its ~17
  // siblings (several of which ALSO mention "timeouts"!):
  //   • rb.title, rb.area, rb.owner   → who/what it's for
  //   • a "Use when:" hint from rb.keywords → the trigger phrases
  // e.g. `${rb.title} (area: ${rb.area}, owner: ${rb.owner}). Use when: ${rb.keywords.join(", ")}.`
  //
  // 💡 This IS progressive disclosure: a cheap index always in context, expensive
  //    bodies on demand. A vague line here → the model loads the wrong runbook (or
  //    all of them) → the exact drift we're escaping.
  // ───────────────────────────────────────────────────────────────────────────
  void rb; // TODO: use `rb` to build the index line.
  return "TODO: write a discriminating one-line skill description";
}

function skillMarkdown(rb: Runbook): string {
  const frontmatter = [
    "---",
    `name: ${slugFor(rb)}`,
    `description: ${JSON.stringify(descriptionFor(rb))}`,
    "---",
  ].join("\n");
  return `${frontmatter}\n\n${renderRunbook(rb)}\n`;
}

async function main() {
  // Start clean so a removed/renamed runbook never leaves a stale skill behind.
  await fs.rm(SKILLS_DIR, { recursive: true, force: true });
  await fs.mkdir(SKILLS_DIR, { recursive: true });

  for (const rb of RUNBOOKS) {
    const slug = slugFor(rb);
    const dir = path.join(SKILLS_DIR, slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "SKILL.md"), skillMarkdown(rb), "utf-8");
  }

  console.log(
    `Wrote ${RUNBOOKS.length} skills to ${path.relative(process.cwd(), SKILLS_DIR)}/`,
  );
  for (const rb of RUNBOOKS) {
    console.log(`  - ${slugFor(rb)}: ${descriptionFor(rb)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
