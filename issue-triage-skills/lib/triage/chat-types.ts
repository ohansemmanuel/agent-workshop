import type { UIMessage } from "ai";

/**
 * Per-message metadata we attach on the server: the model's REAL token usage for
 * the turn (see app/api/chat/route.ts). `inputTokens` is the actual context the
 * model processed — system prompt + conversation, tokenized for real — so we
 * never have to estimate it. `cachedInputTokens` shows prompt caching at work.
 */
export type ChatMetadata = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
};

/**
 * Our typed chat message: `message.metadata` is `ChatMetadata`. `message.parts`
 * also carries the agent's reasoning and `tool-*` parts (skill loads, bash greps)
 * — the UI reads those with the runtime guards `isToolUIPart` / `getToolName`, so
 * the generic `UIMessage` part union is all it needs (no server agent type in the
 * client bundle). The agent-inferred message lives at `TriageUIMessage` in agent.ts.
 */
export type TriageChatMessage = UIMessage<ChatMetadata>;
