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
 * Makes the bloat visible with REAL numbers. The token count is the model's own
 * `inputTokens` from the previous turn (attached as message metadata in the
 * route) — the actual context it processed: system prompt + conversation,
 * tokenized for real. It climbs turn over turn; `cached` shows prompt caching at
 * work. Before the first turn completes we fall back to the static system-prompt
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
      title="Real token usage reported by the model. inputTokens = the whole context it processed this turn (system + conversation). 'cached' tokens are prompt-cached, so they cost less — which is why growing tokens ≠ linear cost."
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
        {stats.runbooks} runbooks · {stats.policies} policies · {stats.incidents}{" "}
        incidents
      </p>
    </div>
  );
}

function n(x: number): string {
  return x.toLocaleString("en-US");
}
