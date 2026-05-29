---
name: rb-auth-02
description: "Password reset emails not arriving (area: auth, owner: platform). Use when: auth, password, reset, email, forgot, link."
---

### RB-AUTH-02 — Password reset emails not arriving
area: auth | owner: platform | SLA: P2 — 2 business-hour first response
keywords: auth, password, reset, email, forgot, link
symptoms:
    - User requests a reset and never receives the email.
diagnose:
    1. Check the email delivery dashboard for bounces/spam complaints (see also RB-NOT-01).
    2. Confirm the address isn't on a suppression list.
resolve:
    1. Remove from suppression if appropriate and re-send.
    2. If domain-wide, coordinate with the deliverability owner.
escalate to: platform team; deliverability owner for domain-wide issues
known incidents: INC-070 (resolved): reset emails throttled by ESP rate cap
gotchas:
    - Reset links expire in 1 hour — an 'invalid link' may just be expiry.
