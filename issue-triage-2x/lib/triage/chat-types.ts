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

/** Our typed chat message: `message.metadata` is `ChatMetadata`. */
export type TriageChatMessage = UIMessage<ChatMetadata>;
