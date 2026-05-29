---
name: rb-chk-02
description: "Card payments declined or gateway timeouts (area: checkout, owner: payments). Use when: payment, declined, gateway, timeout, stripe, charge, checkout."
---

### RB-CHK-02 — Card payments declined or gateway timeouts
area: checkout | owner: payments | SLA: P1 — 30 min first response
keywords: payment, declined, gateway, timeout, stripe, charge, checkout
symptoms:
    - Customers see 'payment could not be processed'.
    - Spike in gateway timeouts during checkout.
diagnose:
    1. Check the payment gateway status page and our gateway error-rate dashboard.
    2. Distinguish hard declines (card issue) from gateway timeouts (our side / gateway side).
    3. Check whether retries are compounding load.
resolve:
    1. For gateway timeouts, enable the degraded-mode queue and retry with backoff.
    2. For hard declines, surface the issuer message; do not auto-retry.
escalate to: payments team; page on-call for sustained timeout rate > 2%
known incidents: INC-077 (resolved): gateway region failover added 800ms latency
gotchas:
    - Never tell a customer their card was charged until the gateway confirms settlement.
    - Retries without backoff make timeouts worse — confirm backoff is on.
