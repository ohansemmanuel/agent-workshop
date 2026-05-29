---
name: rb-api-01
description: "API 401/403 after key rotation (area: api, owner: platform). Use when: api, 401, 403, key, token, auth, rotation."
---

### RB-API-01 — API 401/403 after key rotation
area: api | owner: platform | SLA: P2 — 2 business-hour first response
keywords: api, 401, 403, key, token, auth, rotation
symptoms:
    - Integration starts returning 401/403 after a key was rotated.
diagnose:
    1. Confirm the old key was revoked and the new key deployed everywhere.
    2. Check scopes on the new key match the old.
resolve:
    1. Re-issue a key with the correct scopes; coordinate a cutover window.
escalate to: platform team (API owner)
known incidents: INC-039 (resolved): rotated key missing a scope broke an integration
gotchas:
    - A 403 (scope) is different from a 401 (bad/expired key) — read the body.
