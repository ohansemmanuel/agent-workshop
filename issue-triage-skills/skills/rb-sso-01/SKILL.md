---
name: rb-sso-01
description: "Enterprise SSO / SAML login fails (area: sso, owner: platform). Use when: sso, saml, enterprise, okta, azure, login, assertion."
---

### RB-SSO-01 — Enterprise SSO / SAML login fails
area: sso | owner: platform | SLA: P1 for enterprise — 30 min first response
keywords: sso, saml, enterprise, okta, azure, login, assertion
symptoms:
    - Enterprise users can't log in via SSO after an IdP config change.
    - SAML assertion rejected / clock skew errors.
diagnose:
    1. Compare the customer's IdP metadata with what we have on file (cert rotation?).
    2. Check assertion clock skew and the ACS URL.
resolve:
    1. Re-import updated IdP metadata; verify the signing cert.
    2. Widen allowed clock skew only as a temporary measure.
escalate to: platform team + named enterprise CSM; page on-call for full-tenant outage
known incidents: INC-058 (resolved): expired IdP signing cert blocked a tenant
gotchas:
    - A single rotated cert can lock out an entire tenant — treat as P1 for enterprise.
