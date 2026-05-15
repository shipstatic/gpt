# Content Moderation — Operations Note

**Status:** Operations-level disclosure of how we handle abuse reports
on hosted ShipStatic deployments. Aligns with the EU Digital Services
Act framing referenced in `https://shipstatic.com/terms` and supplies
the timelines and process detail that the live terms page summarizes.

This document may live as a standalone page (e.g.,
`https://shipstatic.com/abuse`), be folded into the terms, or stay
internal. The OpenAI App review team will likely scrutinize this
because ShipStatic hosts user-generated static sites — including, on
the anonymous path, content uploaded by agents.

---

## Scope

ShipStatic hosts static websites uploaded by users (or by agents
acting on behalf of users). We do not author, curate, or
programmatically inspect the content of those sites at upload time,
beyond size, format, and file-count validation.

We **do** act on reported content that violates our terms.

## Reporting abuse

Report problematic content to: `abuse@shipstatic.com`.

Include in the report:
- The full URL of the deploy.
- The specific concern (CSAM, phishing, malware, copyright, hate
  speech, etc.).
- For legal reports (DMCA, court orders, EU DSA Article 16 notices):
  the standard documentation for that process.

## Response timelines

| Report type | Action | Target |
|---|---|---|
| CSAM | Immediate takedown + report to NCMEC and Romanian authorities | < 24 hours |
| Active phishing or malware | Takedown | < 24 hours |
| Copyright (DMCA / EU equivalent) | Notice + takedown per statute | per statute |
| Hate speech / harassment | Reviewed; takedown if clearly violating | < 72 hours |
| General complaint | Reviewed; action depends on context | < 7 days |

These targets are operational commitments aligned with EU DSA
expectations. The live `/terms` page authoritatively says we act
"in accordance with the EU Digital Services Act."

## What takedown means

**Takedown** removes the deployment from R2, KV, and DNS. The
deployment ID is preserved in our records (as deleted) so the same
ID cannot be re-claimed by another user during a post-deletion
window — this prevents subdomain-takeover abuse.

If we restrict content, we inform the uploader with a reason (DSA
requirement). For anonymous deploys without an account, we publish
the reason at the deployment URL until the standard 3-day window
expires.

## Repeat offenders

Accounts (or, on the anonymous path, the originating IPs) that
repeatedly host violating content are blocked from further deploys.

## Cooperation with law enforcement

We cooperate with lawful requests scoped to what the request demands.
We do not preemptively share data or hand over content without legal
process.

## What we do NOT do

- We do not pre-screen deploys for content. Speed-of-deploy is core
  to the product.
- We do not run automated content classifiers on hosted sites (e.g.,
  to scan for nudity, hate speech, etc.).
- We do not differentiate by the agent that submitted the deploy —
  the hosted MCP path through ChatGPT is treated identically to a
  CLI deploy from a developer's machine.

## Internal escalation

(For the OpenAI review team's purposes — operational detail.)

- Reports route to a small operator group via the `abuse@` mailbox.
- Decision-maker for ambiguous cases is the founder; for clear-cut
  cases (CSAM, active phishing) operators can act unilaterally.
- All takedowns are logged with the reporter, the URL, the decision,
  and the timestamp.
