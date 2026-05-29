---
name: rb-bil-01
description: "Missing or duplicate invoices (area: billing, owner: payments). Use when: billing, invoice, invoices, missing, duplicate, receipt."
---

### RB-BIL-01 — Missing or duplicate invoices
area: billing | owner: payments | SLA: P2 — 2 business-hour first response
keywords: billing, invoice, invoices, missing, duplicate, receipt
symptoms:
    - Customer says an invoice is missing from the billing page.
    - Customer was charged twice / sees two invoices.
diagnose:
    1. Invoices generate nightly; confirm whether 24h has elapsed (likely sync delay, not data loss).
    2. Check the billing job dashboard for failed or re-run invoice jobs.
    3. For duplicates, check whether a retry created a second invoice without idempotency.
resolve:
    1. Sync delay: reassure, confirm ETA, do not refund.
    2. True duplicate charge: void the second invoice and issue a refund per RB-PAY-01.
escalate to: billing sub-team in payments; finance for any refund > $50
known incidents: INC-087 (resolved): delayed invoice generation last month
gotchas:
    - Invoices older than 24 months are archived and hidden by default — not missing.
    - A missing invoice is usually a sync delay; confirm before promising anything.
