"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Brain, StopCircle, Warning } from "@phosphor-icons/react";

import { ContextMeter, type ContextStats } from "@/components/ContextMeter";
import type { TriageChatMessage } from "@/lib/triage/chat-types";

// Starter prompts chosen to surface drift: juggling multiple runbooks at once,
// the ambiguous word "timeouts" (which appears in ~7 runbooks), a deep
// step-by-step that should trigger the SLA-first + Refs rules, and a refund
// over $50 (which policy says needs approval — a rule the bloat tends to drop).
const SUGGESTIONS: Array<{ label: string; text: string }> = [
  {
    label: "Two issues at once",
    text: "A customer on mobile Safari can't check out, and another says their invoices vanished. Triage both.",
  },
  {
    label: "Ambiguous “timeouts”",
    text: "Several enterprise users are reporting timeouts. What's happening and what do I do?",
  },
  {
    label: "Enterprise SSO outage",
    text: "Walk me through an enterprise SSO outage step by step for a Business-plan customer.",
  },
  {
    label: "$200 refund",
    text: "A customer wants a $200 refund for a double charge. Can I just issue it?",
  },
];

export function Chat({ stats }: { stats: ContextStats }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } =
    useChat<TriageChatMessage>({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  const busy = status === "submitted" || status === "streaming";

  // The model reports REAL token usage; the route attaches it to each finished
  // message as metadata. Grab the most recent turn's usage — `inputTokens` is the
  // actual context the model processed (system + conversation), no estimating.
  const lastUsage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.metadata?.inputTokens != null)
    ?.metadata;

  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as it streams.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed });
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              Triage Copilot{" "}
              <span className="font-normal text-zinc-400">· issue-triage-2x</span>
            </h1>
            <p className="text-xs text-zinc-500">
              Chat triage with the entire knowledge base crammed into context.
            </p>
          </div>
          <ContextMeter stats={stats} usage={lastUsage} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6">
          {empty ? (
            <EmptyState onPick={submit} disabled={busy} />
          ) : (
            <ul className="space-y-5">
              {messages.map((m, i) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  active={
                    status === "streaming" &&
                    m.role === "assistant" &&
                    i === messages.length - 1
                  }
                />
              ))}
              {status === "submitted" && <TypingRow />}
            </ul>
          )}

          {error && (
            <div
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4"
              role="alert"
            >
              <Warning weight="fill" className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-800">Something went wrong</p>
                <p className="mt-0.5 text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Describe an issue to triage…  (Enter to send, Shift+Enter for newline)"
            className="max-h-40 min-h-[3rem] flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-zinc-900 shadow-card outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Stop"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100"
            >
              <StopCircle weight="fill" className="size-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:cursor-default disabled:opacity-30"
            >
              <ArrowUp weight="bold" className="size-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function MessageRow({
  message,
  active,
}: {
  message: UIMessage;
  active: boolean;
}) {
  const text = message.parts
    .flatMap((p) => (p.type === "text" ? [p.text] : []))
    .join("");

  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {text}
        </div>
      </li>
    );
  }

  // Reasoning ("thinking") tokens, streamed before the answer (sendReasoning + the
  // openai reasoningSummary option in the route). gpt-5* only exposes a SUMMARY of
  // its reasoning, not the raw chain of thought.
  const reasoning = message.parts
    .flatMap((p) => (p.type === "reasoning" ? [p.text] : []))
    .join("\n")
    .trim();

  // Show the thinking panel while this turn is streaming with no answer yet
  // (even before the first reasoning token), or whenever reasoning exists.
  const showPanel = !!reasoning || (active && !text);

  return (
    <li className="flex justify-start">
      <div className="flex max-w-[85%] flex-col gap-2">
        {showPanel && <ReasoningPanel text={reasoning} thinking={!text} />}
        {text ? (
          <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-zinc-800 shadow-card">
            {text}
          </div>
        ) : showPanel ? null : (
          <div className="rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3 text-zinc-400 shadow-card">
            …
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The model's reasoning, surfaced so users see what's going on. While the answer
 * is still pending it streams live under a pulsing "Thinking…" label; once the
 * answer arrives it collapses into an inspectable "Reasoning" disclosure.
 */
function ReasoningPanel({ text, thinking }: { text: string; thinking: boolean }) {
  if (thinking) {
    return (
      <div className="rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Brain
            weight="duotone"
            className="size-4 text-zinc-400 motion-safe:animate-pulse"
          />
          Thinking…
        </div>
        {text && (
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-500">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <details className="group rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-2.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-zinc-500">
        <Brain weight="duotone" className="size-4 text-zinc-400" />
        Reasoning
        <span className="ml-auto font-normal text-zinc-400 group-open:hidden">show</span>
        <span className="ml-auto hidden font-normal text-zinc-400 group-open:inline">
          hide
        </span>
      </summary>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-500">
        {text}
      </p>
    </details>
  );
}

function TypingRow() {
  return (
    <li className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3.5 shadow-card">
        <span className="size-1.5 rounded-full bg-zinc-300 motion-safe:animate-bounce" />
        <span className="size-1.5 rounded-full bg-zinc-300 motion-safe:animate-bounce [animation-delay:120ms]" />
        <span className="size-1.5 rounded-full bg-zinc-300 motion-safe:animate-bounce [animation-delay:240ms]" />
      </div>
    </li>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Triage an issue
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-zinc-500">
        This copilot has every runbook and policy loaded into its context. Ask it
        something, then keep the conversation going — and watch the answers drift
        as the context piles up.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.text)}
            disabled={disabled}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-card transition hover:border-zinc-300 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
