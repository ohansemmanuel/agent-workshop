import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type LanguageModelUsage,
} from "ai";

import type { ChatMetadata, TriageChatMessage } from "@/lib/triage/chat-types";
import { SYSTEM_PROMPT } from "@/lib/triage/context";

// Easy to change: defaults to gpt-5-mini, override with OPENAI_MODEL.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

// The "break the agent" dial. Unset = the model's normal reasoning effort, which
// makes the agent impressively robust (it re-derives the rules every turn). Set
// OPENAI_REASONING_EFFORT=minimal to remove that safety net and watch it drift
// under load — wrong Refs line, wrong SLA tiers, sloppy format. See the README.
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT;

/** The four numbers the ContextMeter shows, pulled from one step's usage. */
function usageMetadata(u: LanguageModelUsage): ChatMetadata {
  return {
    inputTokens: u.inputTokens,
    outputTokens: u.outputTokens,
    totalTokens: u.totalTokens,
    cachedInputTokens: u.cachedInputTokens,
  };
}

/**
 * POST /api/chat
 *
 * A plain streaming chat — `streamText` with the conversation, streamed back via
 * `toUIMessageStreamResponse` for `useChat`. No tools: the agent answers from the
 * knowledge it already has.
 *
 * The (intentional) catch is `system: SYSTEM_PROMPT`. That single string is the
 * ENTIRE knowledge base — every runbook, every policy, the whole incident
 * archive (~13k tokens) — re-sent on EVERY turn. Nothing is retrieved on demand;
 * everything is always in context. That bloat is what makes the agent drift, and
 * it's the problem Agent Skills (progressive disclosure) solves later.
 */
export async function POST(req: Request) {
  const { messages }: { messages: TriageChatMessage[] } = await req.json();

  const result = streamText({
    model: openai(MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    providerOptions: {
      // gpt-5* are reasoning models. We ask for a reasoning summary so the UI can
      // show "what's going on". reasoningEffort is the demo dial (see
      // REASONING_EFFORT above): unset = robust; "minimal" = no safety net → drift.
      openai: {
        reasoningSummary: "auto",
        ...(REASONING_EFFORT ? { reasoningEffort: REASONING_EFFORT } : {}),
      },
    },
  });

  // Report the SINGLE LARGEST step's REAL usage — the true per-turn context size —
  // rather than the cumulative total. This chat is single-step (no tools), so the
  // two are identical here; we compute it the same way as issue-triage-skills (which
  // IS multi-step) so the two meters measure the same thing. `cachedInputTokens`
  // reveals prompt caching, which is why growing tokens ≠ linearly growing cost.
  let peak: ChatMetadata | undefined;

  return result.toUIMessageStreamResponse({
    // Typed so the messageMetadata return is inferred as ChatMetadata.
    originalMessages: messages,
    // Forward reasoning parts to the client. The UI renders them as a live
    // "Thinking…" panel, then a collapsible "Reasoning".
    sendReasoning: true,
    messageMetadata: ({ part }) => {
      // Each step reports its own usage; keep the one with the largest input.
      if (part.type === "finish-step") {
        if (peak == null || (part.usage.inputTokens ?? 0) > (peak.inputTokens ?? 0)) {
          peak = usageMetadata(part.usage);
        }
        return undefined;
      }
      // Attach the peak step to the finished message (fall back to the turn total).
      if (part.type === "finish") {
        return peak ?? usageMetadata(part.totalUsage);
      }
    },
  });
}
