import { openai } from "@ai-sdk/openai";
import { ToolLoopAgent, stepCountIs, type InferAgentUIMessage } from "ai";

import { TRIAGE_SYSTEM_PROMPT } from "./prompt";
import { triageTools } from "./tools";

// Easy to change: defaults to gpt-5-mini, override with OPENAI_MODEL.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

/**
 * The triage agent.
 *
 * This is the tiny CLI agent's hand-written tool loop, now expressed as a single
 * reusable object. `ToolLoopAgent` runs the model → tool call → tool result →
 * repeat cycle for us; `instructions`, `tools`, and `stopWhen` are the exact
 * pieces we passed to the raw loop, declared once here and shared by the route
 * (and anywhere else triage is needed).
 *
 * Note (intentional v1 weakness, unchanged): we do NOT use `Output.object(...)`
 * for structured output. The agent still emits its decision as JSON *text* per
 * the big prompt, and we validate that text against TriageResultSchema at the UI
 * boundary (see lib/triage/parse.ts). Switching to the SDK's structured-output
 * API is a later workshop step.
 */
export const triageAgent = new ToolLoopAgent({
  model: openai(MODEL),
  instructions: TRIAGE_SYSTEM_PROMPT,
  tools: triageTools,
  stopWhen: stepCountIs(5),
});

/**
 * End-to-end type safety: the UI message type — including the typed
 * `tool-searchProductDocs` / `tool-getRecentIncidents` / `tool-getComponentOwner`
 * parts — is inferred straight from the agent definition. The client types
 * `useChat` with this, so tool parts are known at compile time.
 */
export type TriageUIMessage = InferAgentUIMessage<typeof triageAgent>;
