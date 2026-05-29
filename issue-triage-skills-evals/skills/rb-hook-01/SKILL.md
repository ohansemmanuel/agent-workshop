---
name: rb-hook-01
description: "Webhook deliveries failing (area: webhooks, owner: platform). Use when: webhook, delivery, retry, 500, endpoint, timeout, queue."
---

### RB-HOOK-01 — Webhook deliveries failing
area: webhooks | owner: platform | SLA: P2 — 2 business-hour first response
keywords: webhook, delivery, retry, 500, endpoint, timeout, queue
symptoms:
    - Customer's webhook endpoint isn't receiving events / sees gaps.
diagnose:
    1. Check the delivery dashboard for their endpoint: timeouts, 4xx, or 5xx?
    2. Confirm their endpoint responds within the 5s delivery timeout.
resolve:
    1. If their endpoint is slow/down, we retry with backoff for 24h — have them fix and replay.
    2. If we're dropping events, escalate immediately.
escalate to: platform team (events owner)
known incidents: INC-073 (resolved): delivery worker backlog delayed webhooks 20 min
gotchas:
    - A webhook 'timeout' is usually the customer's endpoint being slow, not ours.
