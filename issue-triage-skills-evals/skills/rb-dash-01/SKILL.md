---
name: rb-dash-01
description: "Dashboard slow or blank (area: dashboard, owner: growth). Use when: dashboard, slow, blank, loading, widget, timeout, spinner."
---

### RB-DASH-01 — Dashboard slow or blank
area: dashboard | owner: growth | SLA: P2 — 2 business-hour first response
keywords: dashboard, slow, blank, loading, widget, timeout, spinner
symptoms:
    - Dashboard hangs on a spinner or renders blank.
diagnose:
    1. Identify whether one widget's query is timing out (the page loads widgets in parallel).
    2. Check the query latency dashboard for the slow widget.
resolve:
    1. Disable or degrade the offending widget so the page renders a partial state.
    2. File a perf ticket for the slow query.
escalate to: growth team (dashboard owner)
known incidents: INC-052 (resolved): analytics widget query timed out under load
gotchas:
    - The page should degrade to a partial/empty state, never a blank screen — a blank screen is a bug.
    - Dashboard 'timeouts' are a single widget query, NOT auth or gateway (contrast RB-AUTH-01, RB-CHK-02).
