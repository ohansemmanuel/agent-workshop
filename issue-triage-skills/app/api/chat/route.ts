import { createAgentUIStreamResponse, type LanguageModelUsage } from "ai";

import { getTriageAgent } from "@/lib/triage/agent";
import type { ChatMetadata, TriageChatMessage } from "@/lib/triage/chat-types";

// just-bash (the skill/bash sandbox backend) uses node:fs + globbing, and the
// skill loader reads SKILL.md from disk — so this route needs the Node runtime,
// not the edge runtime.
export const runtime = "nodejs";

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
 * POST /api/chat — the entire route.
 *
 * This is the "after" to issue-triage-2x's bloated route. There, the whole
 * knowledge base rode in `system: SYSTEM_PROMPT` on every turn. Here we hand
 * `createAgentUIStreamResponse` our skills agent and the conversation, and the SDK
 * streams a UI message (text + reasoning + typed `skill`/`bash` tool-call parts)
 * straight to `useChat`. The agent decides which runbook to LOAD and whether to
 * grep the incident archive — nothing is pre-pasted into context.
 */
export async function POST(req: Request) {
  const { messages }: { messages: TriageChatMessage[] } = await req.json();

  // One turn can take several steps (load a skill, grep, compose). We report the
  // SINGLE LARGEST step's usage — the real "context size" the model processed in a
  // call — NOT the cumulative sum across steps. On low reasoning effort the model
  // loads runbooks one-per-step, so the sum balloons (50k+) even though each
  // individual call's context is modest; the peak is the honest number.
  let peak: ChatMetadata | undefined;

  return createAgentUIStreamResponse({
    agent: await getTriageAgent(),
    uiMessages: messages,
    abortSignal: req.signal,
    // Forward reasoning parts so the UI can render a live "Thinking…" panel.
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
