import {
  BookOpen,
  ChatCircleText,
  Siren,
  UsersThree,
  Warning,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import type { TriageResult } from "@/lib/triage/schema";

type Severity = TriageResult["severity"];
type Source = TriageResult["evidence"][number]["source"];

// Color belongs to ONE meaning on this page: severity. Static maps so Tailwind
// can see every class at build time (you can't build `bg-${x}-50` dynamically).
const SEVERITY: Record<Severity, { chip: string; dot: string }> = {
  low: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  medium: { chip: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  high: { chip: "bg-orange-50 text-orange-700 ring-orange-600/20", dot: "bg-orange-500" },
  critical: { chip: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

const SOURCE: Record<Source, { label: string; icon: Icon }> = {
  docs: { label: "Docs", icon: BookOpen },
  incidents: { label: "Incidents", icon: Siren },
  ownership: { label: "Ownership", icon: UsersThree },
  user_report: { label: "User report", icon: ChatCircleText },
};

/**
 * Pure presentational component. Its props are the validated TriageResult, so
 * by the time we render here the shape is guaranteed. This is the payoff of
 * validating at the boundary: the UI never has to defend against a bad shape.
 */
export function TriageResultCard({ result }: { result: TriageResult }) {
  const sev = SEVERITY[result.severity];
  const confidence = Math.round(result.confidence * 100);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${sev.chip}`}
        >
          <span className={`size-1.5 rounded-full ${sev.dot}`} />
          {result.severity}
        </span>
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          {result.category}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-zinc-900">
        {result.summary}
      </h2>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-y border-zinc-100 py-4">
        <Meta label="Affected area" value={result.affectedArea} />
        <Meta label="Owner team" value={result.ownerTeam} />
        <Meta label="Confidence" value={`${confidence}%`} />
      </dl>

      <div className="mt-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          Suggested action
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-800">
          {result.suggestedAction}
        </p>
      </div>

      {result.needsHumanReview && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Needs human review</p>
            <p className="text-[13px] leading-relaxed text-amber-700">
              Flagged for a person to double-check before acting on it.
            </p>
          </div>
        </div>
      )}

      {result.evidence.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Evidence
          </p>
          <ul className="mt-2.5 space-y-2">
            {result.evidence.map((item, i) => {
              const meta = SOURCE[item.source];
              const SourceIcon = meta.icon;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    <SourceIcon className="size-3.5" />
                    {meta.label}
                  </span>
                  <span className="pt-1 text-sm leading-snug text-zinc-700">
                    {item.note}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-sm font-medium text-zinc-900">
        {value}
      </dd>
    </div>
  );
}

/** Loading placeholder that mirrors the card's shape (no generic spinner). */
export function TriageResultSkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="h-6 w-20 rounded-md bg-zinc-100 motion-safe:animate-pulse" />
        <div className="h-4 w-12 rounded bg-zinc-100 motion-safe:animate-pulse" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-5 w-full rounded bg-zinc-100 motion-safe:animate-pulse" />
        <div className="h-5 w-3/4 rounded bg-zinc-100 motion-safe:animate-pulse" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-y border-zinc-100 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 rounded bg-zinc-100 motion-safe:animate-pulse" />
            <div className="h-4 w-12 rounded bg-zinc-100 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <div className="h-3 w-24 rounded bg-zinc-100 motion-safe:animate-pulse" />
        <div className="h-4 w-full rounded bg-zinc-100 motion-safe:animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-zinc-100 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
