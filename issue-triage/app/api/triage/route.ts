import { createAgentUIStreamResponse } from "ai";

import { triageAgent } from "@/lib/triage/agent";

/**
 * POST /api/triage — the entire route.
 *
 * The tiny CLI agent hand-wrote the loop, the `fetch`, the response parsing, and
 * the wire format. Here the AI SDK does all of it: we hand
 * `createAgentUIStreamResponse` our agent and the conversation, and it streams a
 * UI message (text + typed tool-call parts) that `useChat` consumes directly. No
 * `ReadableStream`, no reader loop, no bespoke event format — the SDK owns the
 * plumbing on both ends.
 *
 * Reliability is still our job — it just moved to where the model's output
 * becomes UI state: the client validates the streamed JSON against
 * TriageResultSchema before it renders a card (see lib/triage/parse.ts).
 */
export async function POST(req: Request) {
  const { messages }: { messages: unknown[] } = await req.json();

  return createAgentUIStreamResponse({
    agent: triageAgent,
    uiMessages: messages,
    abortSignal: req.signal,
  });
}
