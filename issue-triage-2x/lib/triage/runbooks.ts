/**
 * The runbook corpus.
 *
 * ~18 support runbooks across the whole product. In a *real* system you would
 * retrieve the ONE runbook relevant to the issue at hand. This demo does the
 * opposite ON PURPOSE: `lib/triage/context.ts` dumps EVERY runbook (plus every
 * policy, plus a long incident archive) into a single system prompt. That bloat
 * is the whole point — it's what makes the agent drift.
 *
 * Note the deliberate overlap: checkout, auth, dashboard, API, webhooks, and
 * sync runbooks all mention "timeouts"; several mention "retries" and "queues".
 * A vague question like "users are seeing timeouts" gives the model many
 * plausible-but-wrong runbooks to confuse — a reliable drift trigger.
 */
export type Runbook = {
  id: string;
  area: string;
  title: string;
  keywords: string[];
  symptoms: string[];
  diagnose: string[];
  resolve: string[];
  escalateTo: string;
  sla: string;
  owner: string;
  knownIncidents: string[];
  gotchas: string[];
};

export const RUNBOOKS: Runbook[] = [
  {
    id: "RB-CHK-01",
    area: "checkout",
    title: "Mobile checkout button unresponsive",
    keywords: ["checkout", "button", "mobile", "safari", "tap", "purchase", "cart"],
    symptoms: [
      "Tapping 'Place order' on iOS Safari does nothing.",
      "Works on desktop, fails on mobile after a recent deploy.",
    ],
    diagnose: [
      "Check the deploy log for changes to the checkout bundle in the last 24h.",
      "Reproduce on iOS Safari with the network inspector; look for a swallowed touch handler error.",
      "Confirm whether the active incident INC-103 covers the report.",
    ],
    resolve: [
      "If a checkout-bundle deploy is implicated, roll it back and re-test the touch handler.",
      "If INC-103 is active, attach the report and do not open a duplicate.",
    ],
    escalateTo: "payments team (page on-call if conversion drop > 5%)",
    sla: "P1 — 30 min first response",
    owner: "payments",
    knownIncidents: ["INC-103 (active): mobile checkout failures after latest deploy"],
    gotchas: [
      "Desktop working does NOT mean resolved — always verify on a real iOS device.",
      "A 'timeout' here is a client touch-handler regression, not a gateway timeout (see RB-CHK-02).",
    ],
  },
  {
    id: "RB-CHK-02",
    area: "checkout",
    title: "Card payments declined or gateway timeouts",
    keywords: ["payment", "declined", "gateway", "timeout", "stripe", "charge", "checkout"],
    symptoms: [
      "Customers see 'payment could not be processed'.",
      "Spike in gateway timeouts during checkout.",
    ],
    diagnose: [
      "Check the payment gateway status page and our gateway error-rate dashboard.",
      "Distinguish hard declines (card issue) from gateway timeouts (our side / gateway side).",
      "Check whether retries are compounding load.",
    ],
    resolve: [
      "For gateway timeouts, enable the degraded-mode queue and retry with backoff.",
      "For hard declines, surface the issuer message; do not auto-retry.",
    ],
    escalateTo: "payments team; page on-call for sustained timeout rate > 2%",
    sla: "P1 — 30 min first response",
    owner: "payments",
    knownIncidents: ["INC-077 (resolved): gateway region failover added 800ms latency"],
    gotchas: [
      "Never tell a customer their card was charged until the gateway confirms settlement.",
      "Retries without backoff make timeouts worse — confirm backoff is on.",
    ],
  },
  {
    id: "RB-BIL-01",
    area: "billing",
    title: "Missing or duplicate invoices",
    keywords: ["billing", "invoice", "invoices", "missing", "duplicate", "receipt"],
    symptoms: [
      "Customer says an invoice is missing from the billing page.",
      "Customer was charged twice / sees two invoices.",
    ],
    diagnose: [
      "Invoices generate nightly; confirm whether 24h has elapsed (likely sync delay, not data loss).",
      "Check the billing job dashboard for failed or re-run invoice jobs.",
      "For duplicates, check whether a retry created a second invoice without idempotency.",
    ],
    resolve: [
      "Sync delay: reassure, confirm ETA, do not refund.",
      "True duplicate charge: void the second invoice and issue a refund per RB-PAY-01.",
    ],
    escalateTo: "billing sub-team in payments; finance for any refund > $50",
    sla: "P2 — 2 business-hour first response",
    owner: "payments",
    knownIncidents: ["INC-087 (resolved): delayed invoice generation last month"],
    gotchas: [
      "Invoices older than 24 months are archived and hidden by default — not missing.",
      "A missing invoice is usually a sync delay; confirm before promising anything.",
    ],
  },
  {
    id: "RB-BIL-02",
    area: "billing",
    title: "Plan change and proration disputes",
    keywords: ["billing", "plan", "upgrade", "downgrade", "proration", "prorate", "credit"],
    symptoms: [
      "Customer disputes the amount charged after an upgrade/downgrade.",
      "Unexpected proration credit or charge.",
    ],
    diagnose: [
      "Pull the subscription change log and the proration breakdown.",
      "Confirm the plan-change effective date and the billing-cycle anchor.",
    ],
    resolve: [
      "Explain the proration math line by line using the breakdown.",
      "If our math is wrong, correct the invoice and apply a credit; flag finance.",
    ],
    escalateTo: "billing sub-team; finance for credits > $50",
    sla: "P3 — same business day",
    owner: "payments",
    knownIncidents: ["INC-091 (resolved): mid-cycle downgrade double-counted a credit"],
    gotchas: ["Annual plans prorate differently from monthly — check the term first."],
  },
  {
    id: "RB-AUTH-01",
    area: "auth",
    title: "Login timeouts and identity-provider errors",
    keywords: ["auth", "login", "sign in", "timeout", "session", "idp", "timing out"],
    symptoms: [
      "Login spins and times out for a subset of users.",
      "Intermittent 'something went wrong' on sign-in.",
    ],
    diagnose: [
      "Check the identity provider status and our auth error-rate dashboard.",
      "Determine whether timeouts correlate with one region or one IdP.",
      "Check for rate limiting on the token endpoint.",
    ],
    resolve: [
      "If the IdP is degraded, post a status note and enable the cached-session grace window.",
      "If rate limiting, raise the token-endpoint limit for the affected tenant.",
    ],
    escalateTo: "platform team; page on-call if login success rate < 95%",
    sla: "P1 — 30 min first response",
    owner: "platform",
    knownIncidents: ["INC-064 (resolved): IdP latency spike caused login timeouts"],
    gotchas: [
      "Login 'timeouts' are usually the IdP or rate limiting, NOT the client (contrast RB-CHK-01).",
      "Sessions last 30 days — a user 'logged out' early points at session invalidation, not expiry.",
    ],
  },
  {
    id: "RB-AUTH-02",
    area: "auth",
    title: "Password reset emails not arriving",
    keywords: ["auth", "password", "reset", "email", "forgot", "link"],
    symptoms: ["User requests a reset and never receives the email."],
    diagnose: [
      "Check the email delivery dashboard for bounces/spam complaints (see also RB-NOT-01).",
      "Confirm the address isn't on a suppression list.",
    ],
    resolve: [
      "Remove from suppression if appropriate and re-send.",
      "If domain-wide, coordinate with the deliverability owner.",
    ],
    escalateTo: "platform team; deliverability owner for domain-wide issues",
    sla: "P2 — 2 business-hour first response",
    owner: "platform",
    knownIncidents: ["INC-070 (resolved): reset emails throttled by ESP rate cap"],
    gotchas: ["Reset links expire in 1 hour — an 'invalid link' may just be expiry."],
  },
  {
    id: "RB-SSO-01",
    area: "sso",
    title: "Enterprise SSO / SAML login fails",
    keywords: ["sso", "saml", "enterprise", "okta", "azure", "login", "assertion"],
    symptoms: [
      "Enterprise users can't log in via SSO after an IdP config change.",
      "SAML assertion rejected / clock skew errors.",
    ],
    diagnose: [
      "Compare the customer's IdP metadata with what we have on file (cert rotation?).",
      "Check assertion clock skew and the ACS URL.",
    ],
    resolve: [
      "Re-import updated IdP metadata; verify the signing cert.",
      "Widen allowed clock skew only as a temporary measure.",
    ],
    escalateTo: "platform team + named enterprise CSM; page on-call for full-tenant outage",
    sla: "P1 for enterprise — 30 min first response",
    owner: "platform",
    knownIncidents: ["INC-058 (resolved): expired IdP signing cert blocked a tenant"],
    gotchas: ["A single rotated cert can lock out an entire tenant — treat as P1 for enterprise."],
  },
  {
    id: "RB-DASH-01",
    area: "dashboard",
    title: "Dashboard slow or blank",
    keywords: ["dashboard", "slow", "blank", "loading", "widget", "timeout", "spinner"],
    symptoms: ["Dashboard hangs on a spinner or renders blank."],
    diagnose: [
      "Identify whether one widget's query is timing out (the page loads widgets in parallel).",
      "Check the query latency dashboard for the slow widget.",
    ],
    resolve: [
      "Disable or degrade the offending widget so the page renders a partial state.",
      "File a perf ticket for the slow query.",
    ],
    escalateTo: "growth team (dashboard owner)",
    sla: "P2 — 2 business-hour first response",
    owner: "growth",
    knownIncidents: ["INC-052 (resolved): analytics widget query timed out under load"],
    gotchas: [
      "The page should degrade to a partial/empty state, never a blank screen — a blank screen is a bug.",
      "Dashboard 'timeouts' are a single widget query, NOT auth or gateway (contrast RB-AUTH-01, RB-CHK-02).",
    ],
  },
  {
    id: "RB-SET-01",
    area: "settings",
    title: "Profile or settings changes not saving",
    keywords: ["settings", "profile", "save", "preferences", "account", "stale"],
    symptoms: ["User edits a setting, it appears to revert."],
    diagnose: [
      "Profile updates save optimistically and reconcile on next fetch — check for a stale client cache.",
      "Check the settings write error rate.",
    ],
    resolve: [
      "Have the user hard-refresh; confirm the value persisted server-side.",
      "If writes are failing server-side, escalate.",
    ],
    escalateTo: "platform team",
    sla: "P3 — same business day",
    owner: "platform",
    knownIncidents: ["INC-045 (resolved): stale cache showed reverted profile values"],
    gotchas: ["A reverted value is usually a stale cache, not a failed write — verify server-side first."],
  },
  {
    id: "RB-API-01",
    area: "api",
    title: "API 401/403 after key rotation",
    keywords: ["api", "401", "403", "key", "token", "auth", "rotation"],
    symptoms: ["Integration starts returning 401/403 after a key was rotated."],
    diagnose: [
      "Confirm the old key was revoked and the new key deployed everywhere.",
      "Check scopes on the new key match the old.",
    ],
    resolve: [
      "Re-issue a key with the correct scopes; coordinate a cutover window.",
    ],
    escalateTo: "platform team (API owner)",
    sla: "P2 — 2 business-hour first response",
    owner: "platform",
    knownIncidents: ["INC-039 (resolved): rotated key missing a scope broke an integration"],
    gotchas: ["A 403 (scope) is different from a 401 (bad/expired key) — read the body."],
  },
  {
    id: "RB-API-02",
    area: "api",
    title: "API rate limiting / 429s",
    keywords: ["api", "429", "rate limit", "throttle", "retry", "quota", "timeout"],
    symptoms: ["Integration sees 429s / requests throttled."],
    diagnose: [
      "Check the tenant's request volume against its rate-limit tier.",
      "Look for a retry storm with no backoff amplifying the problem.",
    ],
    resolve: [
      "Advise exponential backoff + jitter; raise the tier if the usage is legitimate.",
    ],
    escalateTo: "platform team; revenue for tier upgrades",
    sla: "P2 — 2 business-hour first response",
    owner: "platform",
    knownIncidents: ["INC-081 (resolved): a customer retry storm self-inflicted 429s"],
    gotchas: ["429s are often self-inflicted retry storms — fix the client before raising limits."],
  },
  {
    id: "RB-HOOK-01",
    area: "webhooks",
    title: "Webhook deliveries failing",
    keywords: ["webhook", "delivery", "retry", "500", "endpoint", "timeout", "queue"],
    symptoms: ["Customer's webhook endpoint isn't receiving events / sees gaps."],
    diagnose: [
      "Check the delivery dashboard for their endpoint: timeouts, 4xx, or 5xx?",
      "Confirm their endpoint responds within the 5s delivery timeout.",
    ],
    resolve: [
      "If their endpoint is slow/down, we retry with backoff for 24h — have them fix and replay.",
      "If we're dropping events, escalate immediately.",
    ],
    escalateTo: "platform team (events owner)",
    sla: "P2 — 2 business-hour first response",
    owner: "platform",
    knownIncidents: ["INC-073 (resolved): delivery worker backlog delayed webhooks 20 min"],
    gotchas: ["A webhook 'timeout' is usually the customer's endpoint being slow, not ours."],
  },
  {
    id: "RB-NOT-01",
    area: "notifications",
    title: "Email notifications delayed or in spam",
    keywords: ["notification", "email", "delayed", "spam", "delivery", "queue"],
    symptoms: ["Notification emails are late or land in spam."],
    diagnose: [
      "Check the email queue depth and ESP status.",
      "Check the domain's spam reputation / DMARC alignment.",
    ],
    resolve: [
      "Drain the queue / raise ESP throughput; advise allowlisting for spam placement.",
    ],
    escalateTo: "growth team; deliverability owner for reputation issues",
    sla: "P3 — same business day",
    owner: "growth",
    knownIncidents: ["INC-066 (resolved): queue backlog delayed digest emails"],
    gotchas: ["Spam placement is a reputation issue, not a queue issue — don't conflate the two."],
  },
  {
    id: "RB-EXP-01",
    area: "data-export",
    title: "Data export stuck or fails",
    keywords: ["export", "csv", "download", "stuck", "report", "queue", "timeout"],
    symptoms: ["A requested export never completes or errors out."],
    diagnose: [
      "Check the export job queue for the tenant; large exports are chunked.",
      "Look for a job that exceeded the memory limit and was killed.",
    ],
    resolve: [
      "Re-queue with chunking; for very large exports, schedule off-peak.",
    ],
    escalateTo: "growth team (reporting owner)",
    sla: "P3 — same business day",
    owner: "growth",
    knownIncidents: ["INC-049 (resolved): a multi-GB export OOM-killed the worker"],
    gotchas: ["Exports over ~1M rows must be chunked or they OOM the worker."],
  },
  {
    id: "RB-SYNC-01",
    area: "sync",
    title: "Real-time data stale / websocket drops",
    keywords: ["sync", "realtime", "websocket", "stale", "live", "reconnect", "timeout"],
    symptoms: ["Live data stops updating; users must refresh to see changes."],
    diagnose: [
      "Check websocket connection counts and drop rate.",
      "Determine whether reconnect/backoff is functioning.",
    ],
    resolve: [
      "If a fleet node is unhealthy, drain it; clients should reconnect automatically.",
    ],
    escalateTo: "platform team (realtime owner)",
    sla: "P2 — 2 business-hour first response",
    owner: "platform",
    knownIncidents: ["INC-055 (resolved): a bad deploy dropped websockets for 8 min"],
    gotchas: ["Stale data after a drop should self-heal on reconnect — persistent staleness is a bug."],
  },
  {
    id: "RB-UPL-01",
    area: "uploads",
    title: "Large file uploads fail",
    keywords: ["upload", "file", "large", "fail", "multipart", "size", "timeout"],
    symptoms: ["Uploads over a certain size fail or stall near the end."],
    diagnose: [
      "Confirm the file is under the hard size cap; check whether multipart is used.",
      "Look for a proxy timeout on the final assembly step.",
    ],
    resolve: [
      "Advise multipart/resumable upload; raise the proxy timeout for assembly if needed.",
    ],
    escalateTo: "platform team (storage owner)",
    sla: "P3 — same business day",
    owner: "platform",
    knownIncidents: ["INC-061 (resolved): proxy timeout failed large multipart assembly"],
    gotchas: ["A stall 'near the end' is the assembly step, not the transfer."],
  },
  {
    id: "RB-SRCH-01",
    area: "search",
    title: "Search results stale or missing",
    keywords: ["search", "index", "stale", "missing", "results", "lag"],
    symptoms: ["Recently created items don't appear in search."],
    diagnose: [
      "Check indexing lag; new items index asynchronously.",
      "Confirm the indexer isn't backed up.",
    ],
    resolve: [
      "If lag is high, scale the indexer; trigger a targeted reindex for the tenant.",
    ],
    escalateTo: "growth team (search owner)",
    sla: "P3 — same business day",
    owner: "growth",
    knownIncidents: ["INC-043 (resolved): indexer backlog caused 10-min search lag"],
    gotchas: ["A few minutes of indexing lag is expected — not a bug unless sustained."],
  },
  {
    id: "RB-PAY-01",
    area: "payments",
    title: "Chargebacks, disputes, and refunds",
    keywords: ["refund", "chargeback", "dispute", "payment", "credit", "reversal"],
    symptoms: ["Customer requests a refund, or a chargeback/dispute is filed."],
    diagnose: [
      "Confirm the charge, the amount, and whether a dispute is already open with the bank.",
      "Check refund eligibility against the refund policy and the customer's plan.",
    ],
    resolve: [
      "Refunds at or under $50: agent may issue directly and log the reason.",
      "Refunds over $50: require finance approval before issuing — never promise it first.",
      "Open disputes: submit evidence; do NOT also issue a refund (double-credit risk).",
    ],
    escalateTo: "finance for any refund > $50 and all chargebacks",
    sla: "P2 — 2 business-hour first response",
    owner: "payments",
    knownIncidents: ["INC-088 (resolved): a refund issued during an open dispute double-credited"],
    gotchas: [
      "Refund over $50 ALWAYS needs finance approval — this is the most-violated rule.",
      "Never refund AND fight a dispute for the same charge.",
    ],
  },
];

/** Render one runbook as plain text for the system prompt. */
export function renderRunbook(rb: Runbook): string {
  const list = (items: string[], numbered = false) =>
    items
      .map((s, i) => (numbered ? `    ${i + 1}. ${s}` : `    - ${s}`))
      .join("\n");

  return [
    `### ${rb.id} — ${rb.title}`,
    `area: ${rb.area} | owner: ${rb.owner} | SLA: ${rb.sla}`,
    `keywords: ${rb.keywords.join(", ")}`,
    `symptoms:\n${list(rb.symptoms)}`,
    `diagnose:\n${list(rb.diagnose, true)}`,
    `resolve:\n${list(rb.resolve, true)}`,
    `escalate to: ${rb.escalateTo}`,
    `known incidents: ${rb.knownIncidents.join("; ")}`,
    `gotchas:\n${list(rb.gotchas)}`,
  ].join("\n");
}

/**
 * A deterministic incident archive — fake but reproducible (no Date.now /
 * Math.random, so the context is identical every run). Its only job is to add
 * realistic VOLUME, pushing the buried policy rules further from the user's
 * turn (the "lost in the middle" effect that makes the agent drop them).
 */
export function generateIncidentArchive(perRunbook = 6): string {
  const sev = ["P0", "P1", "P2", "P3", "P4"];
  const status = ["resolved", "resolved", "resolved", "mitigated", "won't fix"];
  const lines: string[] = [];

  RUNBOOKS.forEach((rb, ri) => {
    for (let i = 0; i < perRunbook; i++) {
      const n = ri * perRunbook + i;
      const id = `INC-${4200 + n}`;
      const month = String(((n * 7) % 12) + 1).padStart(2, "0");
      const day = String(((n * 13) % 27) + 1).padStart(2, "0");
      const symptom = rb.symptoms[i % rb.symptoms.length];
      const step = (i % rb.resolve.length) + 1;
      lines.push(
        `- ${id} [2025-${month}-${day}] ${sev[n % 5]} ${rb.area}: ${symptom} ` +
          `Triaged with ${rb.id}, resolved via step ${step}. Owner: ${rb.owner}. Status: ${status[n % 5]}.`,
      );
    }
  });

  return lines.join("\n");
}
