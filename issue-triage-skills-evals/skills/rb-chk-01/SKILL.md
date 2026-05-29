---
name: rb-chk-01
description: "Mobile checkout button unresponsive (area: checkout, owner: payments). Use when: checkout, button, mobile, safari, tap, purchase, cart."
---

### RB-CHK-01 — Mobile checkout button unresponsive
area: checkout | owner: payments | SLA: P1 — 30 min first response
keywords: checkout, button, mobile, safari, tap, purchase, cart
symptoms:
    - Tapping 'Place order' on iOS Safari does nothing.
    - Works on desktop, fails on mobile after a recent deploy.
diagnose:
    1. Check the deploy log for changes to the checkout bundle in the last 24h.
    2. Reproduce on iOS Safari with the network inspector; look for a swallowed touch handler error.
    3. Confirm whether the active incident INC-103 covers the report.
resolve:
    1. If a checkout-bundle deploy is implicated, roll it back and re-test the touch handler.
    2. If INC-103 is active, attach the report and do not open a duplicate.
escalate to: payments team (page on-call if conversion drop > 5%)
known incidents: INC-103 (active): mobile checkout failures after latest deploy
gotchas:
    - Desktop working does NOT mean resolved — always verify on a real iOS device.
    - A 'timeout' here is a client touch-handler regression, not a gateway timeout (see RB-CHK-02).
