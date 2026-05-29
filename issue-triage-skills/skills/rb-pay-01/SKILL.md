---
name: rb-pay-01
description: "Chargebacks, disputes, and refunds (area: payments, owner: payments). Use when: refund, chargeback, dispute, payment, credit, reversal."
---

### RB-PAY-01 — Chargebacks, disputes, and refunds
area: payments | owner: payments | SLA: P2 — 2 business-hour first response
keywords: refund, chargeback, dispute, payment, credit, reversal
symptoms:
    - Customer requests a refund, or a chargeback/dispute is filed.
diagnose:
    1. Confirm the charge, the amount, and whether a dispute is already open with the bank.
    2. Check refund eligibility against the refund policy and the customer's plan.
resolve:
    1. Refunds at or under $50: agent may issue directly and log the reason.
    2. Refunds over $50: require finance approval before issuing — never promise it first.
    3. Open disputes: submit evidence; do NOT also issue a refund (double-credit risk).
escalate to: finance for any refund > $50 and all chargebacks
known incidents: INC-088 (resolved): a refund issued during an open dispute double-credited
gotchas:
    - Refund over $50 ALWAYS needs finance approval — this is the most-violated rule.
    - Never refund AND fight a dispute for the same charge.
