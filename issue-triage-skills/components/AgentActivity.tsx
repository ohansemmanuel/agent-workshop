import {
  BookOpen,
  Check,
  CircleNotch,
  Gear,
  MagnifyingGlass,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export type ActivityStatus = "running" | "done" | "error";

export type Activity =
  | {
      id: string;
      kind: "tool";
      toolName: string;
      input?: unknown;
      status: ActivityStatus;
    }
  | { id: string; kind: "composing"; status: ActivityStatus };

// Friendly labels + icons for the agent's tools. `skill` loads one runbook on
// demand; `bash` greps the on-disk incident archive. Falls back to a generic
// label for anything not listed.
const TOOL_META: Record<string, { label: string; icon: Icon }> = {
  skill: { label: "Loading runbook", icon: BookOpen },
  bash: { label: "Searching incidents", icon: MagnifyingGlass },
};

/**
 * Renders the agent's loop as a live timeline: one row per tool call, plus a
 * final "composing" row. This is the whole point of the "after" demo made
 * visible — you can watch it load ONLY the runbook it needs (e.g. "Loading
 * runbook · rb-sso-01") instead of carrying all 18 in context.
 */
export function AgentActivity({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
        Agent activity
      </p>
      <ol className="mt-3 space-y-2.5">
        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}

function ActivityRow({ item }: { item: Activity }) {
  const { label, LeadIcon, detail } = describe(item);

  return (
    <li className="flex items-center gap-3 animate-triage-reveal">
      <LeadIcon className="size-4 shrink-0 text-zinc-400" />
      <span className="text-sm text-zinc-700">{label}</span>
      {detail && (
        <span className="min-w-0 truncate font-mono text-xs text-zinc-400">
          {detail}
        </span>
      )}
      <span className="ml-auto shrink-0">
        <StatusIcon status={item.status} />
      </span>
    </li>
  );
}

function StatusIcon({ status }: { status: ActivityStatus }) {
  if (status === "running") {
    return (
      <CircleNotch
        className="size-4 text-zinc-400 motion-safe:animate-spin"
        weight="bold"
      />
    );
  }
  if (status === "error") {
    return <Warning weight="fill" className="size-4 text-red-500" />;
  }
  return <Check weight="bold" className="size-4 text-emerald-600" />;
}

function describe(item: Activity): {
  label: string;
  LeadIcon: Icon;
  detail: string | null;
} {
  if (item.kind === "composing") {
    return { label: "Composing reply", LeadIcon: Sparkle, detail: null };
  }
  const meta = TOOL_META[item.toolName];
  return {
    label: meta?.label ?? `Running ${item.toolName}`,
    LeadIcon: meta?.icon ?? Gear,
    detail: summarizeInput(item.input),
  };
}

// A short, human-readable hint at what the tool was called with — the runbook id
// it loaded, or the bash command it ran. Best-effort; the input shape is the
// tool's (`skill` → { skillName }, `bash` → { command }).
function summarizeInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.skillName === "string") return o.skillName;
  if (typeof o.command === "string") {
    return o.command.length > 48 ? `${o.command.slice(0, 48)}…` : o.command;
  }
  return null;
}
