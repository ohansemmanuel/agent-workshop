---
name: rb-set-01
description: "Profile or settings changes not saving (area: settings, owner: platform). Use when: settings, profile, save, preferences, account, stale."
---

### RB-SET-01 — Profile or settings changes not saving
area: settings | owner: platform | SLA: P3 — same business day
keywords: settings, profile, save, preferences, account, stale
symptoms:
    - User edits a setting, it appears to revert.
diagnose:
    1. Profile updates save optimistically and reconcile on next fetch — check for a stale client cache.
    2. Check the settings write error rate.
resolve:
    1. Have the user hard-refresh; confirm the value persisted server-side.
    2. If writes are failing server-side, escalate.
escalate to: platform team
known incidents: INC-045 (resolved): stale cache showed reverted profile values
gotchas:
    - A reverted value is usually a stale cache, not a failed write — verify server-side first.
