---
name: rb-sync-01
description: "Real-time data stale / websocket drops (area: sync, owner: platform). Use when: sync, realtime, websocket, stale, live, reconnect, timeout."
---

### RB-SYNC-01 — Real-time data stale / websocket drops
area: sync | owner: platform | SLA: P2 — 2 business-hour first response
keywords: sync, realtime, websocket, stale, live, reconnect, timeout
symptoms:
    - Live data stops updating; users must refresh to see changes.
diagnose:
    1. Check websocket connection counts and drop rate.
    2. Determine whether reconnect/backoff is functioning.
resolve:
    1. If a fleet node is unhealthy, drain it; clients should reconnect automatically.
escalate to: platform team (realtime owner)
known incidents: INC-055 (resolved): a bad deploy dropped websockets for 8 min
gotchas:
    - Stale data after a drop should self-heal on reconnect — persistent staleness is a bug.
