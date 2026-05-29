type OutputTextContent = {
  type: "output_text";
  text: string;
  [key: string]: unknown;
};

type MessageItem = {
  type: "message";
  content?: unknown[];
  [key: string]: unknown;
};

type FunctionCallItem = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
  [key: string]: unknown;
};

type ResponseItem =
  | MessageItem
  | FunctionCallItem
  | {
      type: string;
      [key: string]: unknown;
    };

type OpenAIResponse = {
  id: string;
  output: ResponseItem[];
  output_text?: string;
  [key: string]: unknown;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5";

if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const userQuestion =
  process.argv.slice(2).join(" ") ||
  "It's minute 14 of the workshop. What should we focus on now?";

const tools = [
  {
    type: "function",
    name: "get_workshop_stage",
    description:
      "Return the current stage of a 3-hour React agents workshop given the minute since the workshop started.",
    parameters: {
      type: "object",
      properties: {
        minute: {
          type: "integer",
          description: "Minutes since the workshop started, from 0 to 180.",
        },
      },
      required: ["minute"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const instructions = `
You are a concise workshop assistant.

When the user asks what should happen at a given minute of the workshop,
you must call get_workshop_stage before answering.

After receiving the tool result:
- explain the current stage in plain English
- explain why this stage matters
- keep the answer under 4 sentences
`;

async function main() {
  const answer = await runAgent(userQuestion);

  console.log("\nFINAL ANSWER:");
  console.log(answer);
}

async function runAgent(question: string): Promise<string> {
  // 🧩 ───────────────────────────────────────────────────────────────────────
  // BUILD BY HAND — THE AGENT LOOP (the whole point of minute 30–50)
  //
  // An agent is not magic. It is a LOOP around an LLM call. Write that loop here,
  // by hand, so you never forget what the SDK does for you in every later demo.
  //
  // The recipe (every helper you need already exists in this file):
  //   1. Seed the input with the user's question:
  //        [{ role: "user", content: question }]
  //   2. Loop up to `maxSteps` (e.g. 5) — a hard cap so a misbehaving model can
  //      never spin forever:
  //        a. Call the model:      const res = await callModel(input, prevId)
  //        b. Find tool requests:  res.output.filter(isFunctionCallItem)
  //        c. NONE? You're done →  return extractOutputText(res)
  //        d. For each tool call: parse its `arguments` with safeJsonParse, run
  //           it via runTool(name, args), and collect a result shaped like
  //             { type: "function_call_output", call_id, output: result }
  //        e. Feed those results back as the next `input`, keep res.id as the
  //           next `previous_response_id`, and loop.
  //   3. Fell out of the loop? Throw — it ran too long.
  //
  // 💡 The big idea: the MODEL only *requests* tool calls. YOUR code decides
  //    whether/how to run them and feeds results back. That control is the job —
  //    it's why reliability is an engineering problem, not a prompting one.
  // ───────────────────────────────────────────────────────────────────────────
  throw new Error(
    `TODO(tiny-agent): implement the agent loop in runAgent() for: "${question}"`,
  );
}

async function callModel(
  input: unknown[],
  previousResponseId?: string,
): Promise<OpenAIResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,

    // Important:
    // Keep instructions on every call.
    // When using previous_response_id, instructions from the previous response
    // are not automatically carried over.
    instructions,

    tools,
    input,
    max_output_tokens: 700,

    // We are using previous_response_id, so the previous response state needs
    // to be available to the next request.
    store: true,
  };

  if (previousResponseId) {
    body.previous_response_id = previousResponseId;
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errorBody}`);
  }

  return (await res.json()) as OpenAIResponse;
}

function isFunctionCallItem(item: ResponseItem): item is FunctionCallItem {
  return (
    item.type === "function_call" &&
    typeof (item as { call_id?: unknown }).call_id === "string" &&
    typeof (item as { name?: unknown }).name === "string" &&
    typeof (item as { arguments?: unknown }).arguments === "string"
  );
}

function isMessageItem(item: ResponseItem): item is MessageItem {
  return (
    item.type === "message" &&
    ((item as { content?: unknown }).content === undefined ||
      Array.isArray((item as { content?: unknown }).content))
  );
}

function isOutputTextContent(value: unknown): value is OutputTextContent {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "output_text" &&
    typeof (value as { text?: unknown }).text === "string"
  );
}

async function runTool(name: string, args: unknown): Promise<string> {
  // 🛠️ ───────────────────────────────────────────────────────────────────────
  // BUILD BY HAND — THE TOOL DISPATCH ("validate & execute" half of the loop)
  //
  // The model asked to call a tool by `name` with `args`. This is where YOUR app
  // takes over: match the name to a real function, run it, return its result as
  // a string for the loop to feed back to the model.
  //   • name === "get_workshop_stage" → return getWorkshopStage(args)
  //   • anything else → return a JSON error string. NEVER assume the model only
  //     asks for tools that exist, e.g.:
  //       JSON.stringify({ error: `Unknown tool: ${name}` })
  //
  // 💡 getWorkshopStage() already validates its own input (see readMinute) and
  //    returns errors as DATA, not exceptions — so a bad argument degrades into a
  //    tool result the model can recover from, instead of crashing the loop.
  // ───────────────────────────────────────────────────────────────────────────
  throw new Error(
    `TODO(tiny-agent): implement runTool dispatch (model requested "${name}").`,
  );
}

function getWorkshopStage(args: unknown): string {
  const minute = readMinute(args);

  if (minute === null) {
    return JSON.stringify({
      error: "Invalid minute. Expected an integer from 0 to 180.",
    });
  }

  const stage = workshopAgenda.find(
    (item) => minute >= item.from && minute < item.to,
  );

  if (!stage) {
    return JSON.stringify({
      minute,
      stage: "Workshop finished",
      goal: "Wrap up, answer questions, and point attendees to the repo.",
      why_it_matters:
        "The core concepts have already been covered, so the goal is to help attendees connect the material to their own products.",
    });
  }

  return JSON.stringify({
    minute,
    stage: stage.name,
    goal: stage.goal,
    why_it_matters: stage.whyItMatters,
  });
}

function readMinute(args: unknown): number | null {
  if (!args || typeof args !== "object") {
    return null;
  }

  const maybeMinute = (args as { minute?: unknown }).minute;

  if (
    typeof maybeMinute !== "number" ||
    !Number.isInteger(maybeMinute) ||
    maybeMinute < 0 ||
    maybeMinute > 180
  ) {
    return null;
  }

  return maybeMinute;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {
      error: "Tool arguments were not valid JSON.",
      raw,
    };
  }
}

function extractOutputText(response: OpenAIResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks: string[] = [];

  for (const item of response.output) {
    if (!isMessageItem(item)) {
      continue;
    }

    for (const content of item.content ?? []) {
      if (isOutputTextContent(content)) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

const workshopAgenda = [
  {
    from: 0,
    to: 10,
    name: "Opening: why React teams should care",
    goal: "Frame how agent failures become user-facing UI failures.",
    whyItMatters:
      "This gives attendees a concrete reason to care about reliability, not just agent demos.",
  },
  {
    from: 10,
    to: 30,
    name: "What is an agent, really?",
    goal: "Demystify the model/tool/state loop behind agents.",
    whyItMatters:
      "Everything else in the workshop builds on this loop: tools, Skills, evals, contracts, and guardrails.",
  },
  {
    from: 30,
    to: 50,
    name: "Build the smallest possible agent",
    goal: "Implement a tiny agent by hand using TypeScript and one tool.",
    whyItMatters:
      "Attendees see that an agent is not magic. It is a loop around an LLM call.",
  },
  {
    from: 50,
    to: 75,
    name: "Build the first real Next.js AI feature",
    goal: "Create a simple React/Next.js AI feature with a route/action and UI.",
    whyItMatters: "This connects the agent loop to a real product surface.",
  },
  {
    from: 75,
    to: 90,
    name: "Review the brittle version",
    goal: "Inspect where big prompts, weak contracts, and loose tools create fragility.",
    whyItMatters: "This sets up the need for Skills, validation, and evals.",
  },
  {
    from: 90,
    to: 100,
    name: "Break",
    goal: "Give attendees time to reset.",
    whyItMatters: "The second half requires more critical thinking.",
  },
  {
    from: 100,
    to: 120,
    name: "Break the feature intentionally",
    goal: "Trigger output drift, tool misuse, prompt injection, and invalid UI states.",
    whyItMatters:
      "Reliability becomes obvious once attendees see the feature fail.",
  },
  {
    from: 120,
    to: 150,
    name: "Refactor into Agent Skills",
    goal: "Move product-specific behavior out of one giant prompt and into a reusable Skill pack.",
    whyItMatters:
      "This teaches the shift from prompt tweaking to versioned operating procedures.",
  },
  {
    from: 150,
    to: 170,
    name: "Add lightweight evals",
    goal: "Add regression cases and validation so behavior changes are reviewable.",
    whyItMatters: "Agent behavior should be tested like product behavior.",
  },
  {
    from: 170,
    to: 180,
    name: "Final review and shipping checklist",
    goal: "Summarize the architecture and give attendees a practical checklist.",
    whyItMatters: "They leave with a mental model they can apply at work.",
  },
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
