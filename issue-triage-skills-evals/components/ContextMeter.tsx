import { Stack } from "@phosphor-icons/react";

import type { ChatMetadata } from "@/lib/triage/chat-types";

export type ContextStats = {
  runbooks: number;
  policies: number;
  incidents: number;
  chars: number;
  estTokens: number;
};

/**
 * Makes the payoff visible with REAL numbers. The token count is the model's own
 * `inputTokens` for the LARGEST single step of the previous turn (attached as
 * message metadata in the route) — the real "context size" it processed in one
 * call: the THIN system prompt + the skill index + the conversation + whatever
 * runbook it loaded. We show the peak step, not the sum across the tool-loop steps,
 * so the number reads as context size (the sum would balloon on low effort, when
 * the model loads runbooks one-per-step). Compared with issue-triage-2x's ~14k
 * every turn, this stays small, because runbooks and incidents are pulled in on
 * demand, not pasted. Before the first turn we fall back to the static base-prompt
 * size estimate.
 */
export function ContextMeter({
  stats,
  usage,
}: {
  stats: ContextStats;
  usage?: ChatMetadata;
}) {
  const input = usage?.inputTokens;
  const cached = usage?.cachedInputTokens ?? 0;
  const out = usage?.outputTokens ?? 0;

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 shadow-card"
      title="Real token usage reported by the model: the largest single step this turn — the actual context size in one call (thin prompt + skill index + conversation + any loaded runbook), not the sum across the agent's steps. Runbooks and incidents are fetched on demand, not pasted, so this stays far smaller than issue-triage-2x. 'cached' tokens are prompt-cached, so they cost even less."
    >
      <div className="flex items-center gap-2">
        <Stack weight="duotone" className="size-4 shrink-0 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-600">
          {input != null ? "Context · last turn" : "Context · system"}
        </span>
        <span className="font-mono text-xs font-semibold text-amber-700">
          {input != null ? `${n(input)} in` : `~${n(stats.estTokens)} (est.)`}
        </span>
      </div>
      <p className="mt-1 pl-6 font-mono text-[11px] leading-relaxed text-zinc-400">
        {input != null && cached > 0 && (
          <>
            <span className="text-emerald-600">{n(cached)}</span> cached
            <span className="px-1 text-zinc-300">·</span>{" "}
          </>
        )}
        {input != null && out > 0 && (
          <>
            <span className="text-zinc-600">{n(out)}</span> out
            <span className="px-1 text-zinc-300">·</span>{" "}
          </>
        )}
        {stats.policies} policies in prompt · {stats.runbooks} runbooks +{" "}
        {stats.incidents} incidents on demand
      </p>
    </div>
  );
}

function n(x: number): string {
  return x.toLocaleString("en-US");
}
