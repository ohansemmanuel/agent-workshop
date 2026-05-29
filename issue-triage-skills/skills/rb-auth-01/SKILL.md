---
name: rb-auth-01
description: "Login timeouts and identity-provider errors (area: auth, owner: platform). Use when: auth, login, sign in, timeout, session, idp, timing out."
---

### RB-AUTH-01 — Login timeouts and identity-provider errors
area: auth | owner: platform | SLA: P1 — 30 min first response
keywords: auth, login, sign in, timeout, session, idp, timing out
symptoms:
    - Login spins and times out for a subset of users.
    - Intermittent 'something went wrong' on sign-in.
diagnose:
    1. Check the identity provider status and our auth error-rate dashboard.
    2. Determine whether timeouts correlate with one region or one IdP.
    3. Check for rate limiting on the token endpoint.
resolve:
    1. If the IdP is degraded, post a status note and enable the cached-session grace window.
    2. If rate limiting, raise the token-endpoint limit for the affected tenant.
escalate to: platform team; page on-call if login success rate < 95%
known incidents: INC-064 (resolved): IdP latency spike caused login timeouts
gotchas:
    - Login 'timeouts' are usually the IdP or rate limiting, NOT the client (contrast RB-CHK-01).
    - Sessions last 30 days — a user 'logged out' early points at session invalidation, not expiry.
