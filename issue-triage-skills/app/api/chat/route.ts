import { createAgentUIStreamResponse } from "ai";

import { getTriageAgent } from "@/lib/triage/agent";
import type { TriageChatMessage } from "@/lib/triage/chat-types";

// just-bash (the skill/bash sandbox backend) uses node:fs + globbing, and the
// skill loader reads SKILL.md from disk — so this route needs the Node runtime,
// not the edge runtime.
export const runtime = "nodejs";

/**
 * POST /api/chat — the entire route.
 *
 * This is the "after" to issue-triage-2x's bloated route. There, the whole
 * knowledge base rode in `system: SYSTEM_PROMPT` on every turn. Here we hand
 * `createAgentUIStreamResponse` our skills agent and the conversation, and the SDK
 * streams a UI message (text + reasoning + typed `skill`/`bash` tool-call parts)
 * straight to `useChat`. The agent decides which runbook to LOAD and whether to
 * grep the incident archive — nothing is pre-pasted into context.
 *
 * We still attach the model's REAL token usage to each finished message, so the
 * ContextMeter shows the true per-turn context size — now a few k instead of ~14k.
 */
export async function POST(req: Request) {
  const { messages }: { messages: TriageChatMessage[] } = await req.json();

  return createAgentUIStreamResponse({
    agent: await getTriageAgent(),
    uiMessages: messages,
    abortSignal: req.signal,
    // Forward reasoning parts so the UI can render a live "Thinking…" panel.
    sendReasoning: true,
    // Attach the model's REAL token usage to the finished message. `inputTokens`
    // is the actual context processed this turn (thin prompt + skill index +
    // conversation + any loaded runbook), tokenized for real — no estimating.
    messageMetadata: ({ part }) => {
      if (part.type === "finish") {
        const u = part.totalUsage;
        return {
          inputTokens: u.inputTokens,
          outputTokens: u.outputTokens,
          totalTokens: u.totalTokens,
          cachedInputTokens: u.cachedInputTokens,
        };
      }
    },
  });
}
