import { tool } from "ai";
import { z } from "zod";

/**
 * Local, deterministic "product knowledge" tools.
 *
 * In a real app these would be MCP servers, internal APIs, or a search index
 * (Linear, GitHub, Sentry, your docs site...). Here they are plain functions
 * returning fake-but-realistic data so the demo is fully offline and
 * reproducible. Same input -> same output, every time.
 *
 * Remember the lesson from the tiny CLI agent: the model does NOT run these.
 * The model REQUESTS a call; the AI SDK validates the input against the Zod
 * schema, runs `execute`, and feeds the result back into the loop.
 */

// The product areas our fake tools know about. (The schema also allows
// "unknown", but you can't look up incidents/owners for an unknown area.)
const ProductArea = z.enum([
  "checkout",
  "billing",
  "auth",
  "dashboard",
  "settings",
]);

// --- Fake data ---------------------------------------------------------------

const DOCS: Array<{
  area: string;
  title: string;
  body: string;
  keywords: string[];
}> = [
  {
    area: "checkout",
    title: "Checkout on mobile",
    body: "The mobile checkout button submits the order form. On iOS Safari it relies on a touch handler that has regressed in past releases. Verify the button after any deploy that touches the checkout bundle.",
    keywords: ["checkout", "cart", "pay", "purchase", "safari", "mobile", "order"],
  },
  {
    area: "billing",
    title: "Billing dashboard & invoices",
    body: "Invoices are generated nightly and listed on the billing dashboard. A missing invoice is usually a sync delay rather than data loss. Invoices older than 24 months are archived and hidden by default.",
    keywords: ["billing", "invoice", "invoices", "subscription", "receipt", "charge"],
  },
  {
    area: "auth",
    title: "Auth: login & sessions",
    body: "Login issues sessions that last 30 days. Timeouts during login usually point at the identity provider or rate limiting, not the client. Password resets are handled by the platform team.",
    keywords: ["auth", "login", "log in", "sign in", "session", "password", "logout", "timeout", "timing out"],
  },
  {
    area: "dashboard",
    title: "Dashboard loading",
    body: "The dashboard loads widgets in parallel. Slow loads are usually a single widget's query timing out. The page should still render with a partial/empty state rather than a blank screen.",
    keywords: ["dashboard", "widget", "widgets", "loading", "home", "overview"],
  },
  {
    area: "settings",
    title: "Settings & profile updates",
    body: "Profile updates save optimistically and reconcile on the next fetch. If a save appears to do nothing, it is often a stale client cache rather than a server failure.",
    keywords: ["settings", "profile", "preferences", "account", "notification"],
  },
];

const INCIDENTS: Record<
  z.infer<typeof ProductArea>,
  Array<{ id: string; status: string; summary: string }>
> = {
  // Checkout has an ACTIVE incident on purpose — this is the happy-path demo.
  checkout: [
    {
      id: "INC-103",
      status: "investigating",
      summary: "Mobile checkout failures after latest deploy",
    },
  ],
  // One old, resolved incident so "billing" isn't suspiciously empty.
  billing: [
    {
      id: "INC-087",
      status: "resolved",
      summary: "Delayed invoice generation (resolved last month)",
    },
  ],
  auth: [],
  dashboard: [],
  settings: [],
};

const OWNERS: Record<z.infer<typeof ProductArea>, string> = {
  checkout: "payments",
  billing: "payments",
  auth: "platform",
  dashboard: "growth",
  settings: "platform",
};

// --- Tools -------------------------------------------------------------------

export const searchProductDocs = tool({
  description:
    "Search product documentation for information about a product area. Use this when the issue mentions a specific feature, page, or flow.",
  inputSchema: z.object({
    query: z.string().describe("Keywords describing the feature, page, or flow."),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    const matches = DOCS.filter((doc) =>
      doc.keywords.some((kw) => q.includes(kw)),
    );

    return {
      query,
      results: matches.slice(0, 3).map(({ area, title, body }) => ({
        area,
        title,
        body,
      })),
    };
  },
});

export const getRecentIncidents = tool({
  description:
    "Check whether there are recent incidents for a product area. Use this before marking something as high or critical severity.",
  inputSchema: z.object({
    area: ProductArea,
  }),
  execute: async ({ area }) => {
    return { area, incidents: INCIDENTS[area] };
  },
});

export const getComponentOwner = tool({
  description:
    "Return the team responsible for a product area. Use this when assigning an owner team.",
  inputSchema: z.object({
    area: ProductArea,
  }),
  execute: async ({ area }) => {
    return { area, ownerTeam: OWNERS[area] };
  },
});

/**
 * The tool set we hand to the model. The KEYS here are the tool names the model
 * sees and calls — keep them in sync with what the prompt references.
 *
 * In the tiny CLI agent this registry was a hand-written `runTool()` switch on
 * the tool name, plus `safeJsonParse` on the raw argument string. Here the SDK
 * does both: it matches the key, validates args against each tool's inputSchema,
 * and calls `execute`.
 */
export const triageTools = {
  searchProductDocs,
  getRecentIncidents,
  getComponentOwner,
};
