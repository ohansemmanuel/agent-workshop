---
name: rb-not-01
description: "Email notifications delayed or in spam (area: notifications, owner: growth). Use when: notification, email, delayed, spam, delivery, queue."
---

### RB-NOT-01 — Email notifications delayed or in spam
area: notifications | owner: growth | SLA: P3 — same business day
keywords: notification, email, delayed, spam, delivery, queue
symptoms:
    - Notification emails are late or land in spam.
diagnose:
    1. Check the email queue depth and ESP status.
    2. Check the domain's spam reputation / DMARC alignment.
resolve:
    1. Drain the queue / raise ESP throughput; advise allowlisting for spam placement.
escalate to: growth team; deliverability owner for reputation issues
known incidents: INC-066 (resolved): queue backlog delayed digest emails
gotchas:
    - Spam placement is a reputation issue, not a queue issue — don't conflate the two.
