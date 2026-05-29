---
name: rb-upl-01
description: "Large file uploads fail (area: uploads, owner: platform). Use when: upload, file, large, fail, multipart, size, timeout."
---

### RB-UPL-01 — Large file uploads fail
area: uploads | owner: platform | SLA: P3 — same business day
keywords: upload, file, large, fail, multipart, size, timeout
symptoms:
    - Uploads over a certain size fail or stall near the end.
diagnose:
    1. Confirm the file is under the hard size cap; check whether multipart is used.
    2. Look for a proxy timeout on the final assembly step.
resolve:
    1. Advise multipart/resumable upload; raise the proxy timeout for assembly if needed.
escalate to: platform team (storage owner)
known incidents: INC-061 (resolved): proxy timeout failed large multipart assembly
gotchas:
    - A stall 'near the end' is the assembly step, not the transfer.
