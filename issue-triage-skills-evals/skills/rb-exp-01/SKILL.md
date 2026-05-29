---
name: rb-exp-01
description: "Data export stuck or fails (area: data-export, owner: growth). Use when: export, csv, download, stuck, report, queue, timeout."
---

### RB-EXP-01 — Data export stuck or fails
area: data-export | owner: growth | SLA: P3 — same business day
keywords: export, csv, download, stuck, report, queue, timeout
symptoms:
    - A requested export never completes or errors out.
diagnose:
    1. Check the export job queue for the tenant; large exports are chunked.
    2. Look for a job that exceeded the memory limit and was killed.
resolve:
    1. Re-queue with chunking; for very large exports, schedule off-peak.
escalate to: growth team (reporting owner)
known incidents: INC-049 (resolved): a multi-GB export OOM-killed the worker
gotchas:
    - Exports over ~1M rows must be chunked or they OOM the worker.
