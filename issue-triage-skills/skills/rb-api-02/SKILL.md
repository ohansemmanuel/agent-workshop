---
name: rb-api-02
description: "API rate limiting / 429s (area: api, owner: platform). Use when: api, 429, rate limit, throttle, retry, quota, timeout."
---

### RB-API-02 — API rate limiting / 429s
area: api | owner: platform | SLA: P2 — 2 business-hour first response
keywords: api, 429, rate limit, throttle, retry, quota, timeout
symptoms:
    - Integration sees 429s / requests throttled.
diagnose:
    1. Check the tenant's request volume against its rate-limit tier.
    2. Look for a retry storm with no backoff amplifying the problem.
resolve:
    1. Advise exponential backoff + jitter; raise the tier if the usage is legitimate.
escalate to: platform team; revenue for tier upgrades
known incidents: INC-081 (resolved): a customer retry storm self-inflicted 429s
gotchas:
    - 429s are often self-inflicted retry storms — fix the client before raising limits.
