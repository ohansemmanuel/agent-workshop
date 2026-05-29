"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { CircleNotch, ClipboardText, Warning } from "@phosphor-icons/react";

import { AgentActivity, type Activity } from "@/components/AgentActivity";
import { TriageResultCard } from "@/components/TriageResultCard";
import { parseTriageText } from "@/lib/triage/parse";
import type { TriageUIMessage } from "@/lib/triage/agent";

// Tiny class joiner so conditional Tailwind stays readable (no extra dep).
const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

// Sample issues for the live demo. The first four are the "it works" cases.
// The last two are deliberate traps we will spring in the next section:
const EXAMPLES: Array<{ label: string; text: string }> = [
  {
    label: "Bug (happy path)",
    text: "The checkout button does nothing on mobile Safari after the latest deploy.",
  },
  {
    label: "Feature request",
    text: "Can we add dark mode to the billing page?",
  },
  {
    label: "Support issue",
    text: "A customer says invoices are missing from their dashboard.",
  },
  { label: "Ambiguous", text: "Something feels weird on the settings page." },
];

type Debug = { raw?: unknown; issues?: unknown };

export function IssueTriageDemo() {
  const [issue, setIssue] = useState("");

  // The AI SDK owns the transport, the stream, and the message/tool-part state.
  // We type it with the agent's inferred UIMessage for end-to-end type safety.
  const { messages, sendMessage, status, setMessages, error } =
    useChat<TriageUIMessage>({
      transport: new DefaultChatTransport({ api: "/api/triage" }),
    });

  const busy = status === "submitted" || status === "streaming";
  const activeExample = EXAMPLES.find((ex) => ex.text === issue)?.label ?? null;

  // Everything below is DERIVED from useChat state — no duplicated local copies.
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const parts = lastAssistant?.parts ?? [];

  // The agent's tool calls → the live activity timeline.
  const activity: Activity[] = parts.filter(isToolUIPart).map((part) => {
    const hasInput =
      part.state === "input-available" || part.state === "output-available";
    return {
      id: part.toolCallId,
      kind: "tool",
      toolName: getToolName(part),
      input: hasInput ? part.input : undefined,
      status:
        part.state === "output-available"
          ? "done"
          : part.state === "output-error"
            ? "error"
            : "running",
    };
  });

  // The model's final answer (the JSON, streamed as text parts).
  const answerText = parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("");

  if (busy && answerText) {
    activity.push({
      id: "__composing__",
      kind: "composing",
      status: "running",
    });
  }

  // Validate the streamed JSON at the UI boundary, but only once the run is done.
  const result =
    status === "ready" && answerText ? parseTriageText(answerText) : null;

  const started = busy || messages.some((m) => m.role === "assistant");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim() || busy) return;
    // Each triage is a fresh, single-shot run — not an ongoing conversation.
    setMessages([]);
    void sendMessage({ text: issue });
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          AI Issue Triage Assistant
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">
          Paste a bug report, feature request, or support issue.
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Try one:</span>
          {EXAMPLES.map((ex) => {
            const isActive = activeExample === ex.label;
            return (
              <button
                key={ex.label}
                type="button"
                onClick={() => setIssue(ex.text)}
                disabled={busy}
                aria-pressed={isActive}
                className={cx(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15",
                  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900",
                )}
              >
                {ex.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="issue"
            className="block text-sm font-medium text-zinc-700"
          >
            Issue report
          </label>
          <textarea
            id="issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="e.g. The checkout button does nothing on mobile Safari after the latest deploy."
            rows={5}
            disabled={busy}
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-zinc-900 shadow-card outline-none transition placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={busy || !issue.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/15 active:scale-[0.98] disabled:cursor-default disabled:opacity-40"
        >
          {busy ? "Triaging…" : "Triage issue"}
        </button>
      </form>

      <div className="space-y-4">
        <p className="sr-only" role="status" aria-live="polite">
          {busy
            ? "Triaging issue…"
            : result?.ok
              ? "Triage complete."
              : error
                ? `Triage failed: ${error.message}`
                : ""}
        </p>

        {!started && <EmptyState />}

        {/* Live agent timeline — stays visible after the run so you can see what
            the agent actually did, above the result or the error. */}
        {started && activity.length > 0 && (
          <AgentActivity activity={activity} />
        )}

        {/* Brief gap before the model's first action. */}
        {busy && activity.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-card">
            <CircleNotch
              className="size-4 text-zinc-400 motion-safe:animate-spin"
              weight="bold"
            />
            Analyzing the issue…
          </div>
        )}

        {/* Transport / model error (surfaced by useChat). */}
        {error && <ErrorAlert error={error.message} debug={null} />}

        {/* Contract violation: parsed, but invalid JSON or wrong shape. */}
        {result && !result.ok && (
          <ErrorAlert
            error={result.error}
            debug={{ raw: result.raw, issues: result.issues }}
          />
        )}

        {/* Finished, but the model produced no answer text at all. */}
        {status === "ready" && lastAssistant && !answerText && !error && (
          <ErrorAlert
            error="The model finished without returning a triage decision."
            debug={null}
          />
        )}

        {/* Success: validated TriageResult. */}
        {result?.ok && (
          <div className="animate-triage-reveal">
            <TriageResultCard result={result.data} />
          </div>
        )}
      </div>
    </section>
  );
}

function ErrorAlert({ error, debug }: { error: string; debug: Debug | null }) {
  const hasDebug =
    debug && (debug.raw !== undefined || debug.issues !== undefined);

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-4"
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <Warning
          weight="fill"
          className="mt-0.5 size-4 shrink-0 text-red-500"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-800">Triage failed</p>
          <p className="mt-0.5 text-sm text-red-700">{error}</p>

          {hasDebug && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
                Show what the model returned
              </summary>
              {debug.raw !== undefined && (
                <>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    Raw output
                  </p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-red-200/70 bg-white p-3 font-mono text-xs text-zinc-700">
                    {typeof debug.raw === "string"
                      ? debug.raw
                      : JSON.stringify(debug.raw, null, 2)}
                  </pre>
                </>
              )}
              {debug.issues !== undefined && (
                <>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    Schema violations
                  </p>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-red-200/70 bg-white p-3 font-mono text-xs text-zinc-700">
                    {JSON.stringify(debug.issues, null, 2)}
                  </pre>
                </>
              )}
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-6 py-14 text-center">
      <ClipboardText className="size-6 text-zinc-300" />
      <p className="mt-3 text-sm font-medium text-zinc-500">
        Triage results will appear here
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Paste an issue above, or pick an example to start.
      </p>
    </div>
  );
}
