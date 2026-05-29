---
name: rb-srch-01
description: "Search results stale or missing (area: search, owner: growth). Use when: search, index, stale, missing, results, lag."
---

### RB-SRCH-01 — Search results stale or missing
area: search | owner: growth | SLA: P3 — same business day
keywords: search, index, stale, missing, results, lag
symptoms:
    - Recently created items don't appear in search.
diagnose:
    1. Check indexing lag; new items index asynchronously.
    2. Confirm the indexer isn't backed up.
resolve:
    1. If lag is high, scale the indexer; trigger a targeted reindex for the tenant.
escalate to: growth team (search owner)
known incidents: INC-043 (resolved): indexer backlog caused 10-min search lag
gotchas:
    - A few minutes of indexing lag is expected — not a bug unless sustained.
