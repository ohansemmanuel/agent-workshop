---
name: rb-bil-02
description: "Plan change and proration disputes (area: billing, owner: payments). Use when: billing, plan, upgrade, downgrade, proration, prorate, credit."
---

### RB-BIL-02 — Plan change and proration disputes
area: billing | owner: payments | SLA: P3 — same business day
keywords: billing, plan, upgrade, downgrade, proration, prorate, credit
symptoms:
    - Customer disputes the amount charged after an upgrade/downgrade.
    - Unexpected proration credit or charge.
diagnose:
    1. Pull the subscription change log and the proration breakdown.
    2. Confirm the plan-change effective date and the billing-cycle anchor.
resolve:
    1. Explain the proration math line by line using the breakdown.
    2. If our math is wrong, correct the invoice and apply a credit; flag finance.
escalate to: billing sub-team; finance for credits > $50
known incidents: INC-091 (resolved): mid-cycle downgrade double-counted a credit
gotchas:
    - Annual plans prorate differently from monthly — check the term first.
