# Submission History

A log of OpenAI plugin submissions and their outcomes. Append one entry
per submission, and one when a version is PUBLISHED. Reviewers' notes,
Case IDs, and acceptance / rejection reasons live here so future-us can
see what worked and what didn't.

**The last `Published` entry is what OpenAI holds.** A published plugin
serves a snapshot of the tool surface taken at scan time, so this file is
the platform's only record of which version ChatGPT users actually get.
`pnpm preflight` reads the latest `Published` entry and reports how far
behind the live server it is; the heading shape below is what it parses.

Format per entry (the status is one of `Prepared` (our half is ready,
the portal not yet opened), `Submitted`, `In review`, `Changes requested`,
`Rejected`, `Approved`, `Published`):

```
## YYYY-MM-DD — vX.Y.Z — <status>

**Case ID:** <from OpenAI email>
**Submitted by:** <human>
**Reviewer feedback:** <verbatim or summarized>
**Action taken:** <what we changed in response>
```

---

## 2026-05-15 — v0.6.0 — In review

**Case ID:** C-Zbh6GuQ45XKi
**Submitted by:** Constantin
**Reviewer feedback:** (pending — initial submission)
**Action taken:** (pending — awaiting review outcome)

Notes:
- First public submission of the ShipStatic ChatGPT App.
- Hosted MCP live at `https://mcp.shipstatic.com/gpt`, server reports v0.6.0.
- All preflight checks green at submission time.
- Domain verification token placed at `https://www.shipstatic.com/.well-known/openai-apps-challenge` and confirmed live before submit.
- Privacy and terms updated on `shipstatic.com` to disclose the anonymous-deploy flow.
- 4 listing screenshots uploaded: 2 widget-only (light + dark), 1 web in-context (dark), 1 iOS in-context.
- 5 test prompts submitted: 3 positive (Hello world, Hello reviewer, Pomodoro/Snake/Tic-tac-toe), 2 negative (oversize file, custom domain on anonymous endpoint), plus the operation-out-of-scope (delete) test.

## 2026-08 (date not recorded) — v1.0.0 — Published

**Case ID:** (not recorded)
**Submitted by:** Constantin
**Reviewer feedback:** approved; no notes kept.
**Action taken:** published to the directory.

Notes:
- Reconstructed 2026-09-12 from the portal, which shows the plugin at
  1.0.0. That version predates OAuth on the hosted door (2026-08-13), so
  the snapshot OpenAI serves declares fifteen anonymous tools and no
  authorization server: every "Connect" in ChatGPT failed inside ChatGPT
  before a request reached us, for the whole of the 2026-08-30 to 09-12
  ChatGPT wave (one consent on the ChatGPT OAuth client against thousands
  of anonymous deploys). Anonymous deploys were unaffected.
- The gap between this entry and the next is the reason the preflight
  now reads this file: nothing compared what OpenAI holds to what is live.

## 2026-09-12 — v1.10.2 — Prepared

**Case ID:** (fill in from OpenAI's email)
**Submitted by:** Constantin
**Reviewer feedback:** (pending)
**Action taken:** (pending)

Notes:
- The first resubmission since 1.0.0. Two server-side changes landed the
  same day so the scan imports a correct auth posture: every tool now
  declares `securitySchemes`, and `/gpt` answers a credential refusal as
  an error result carrying `_meta["mcp/www_authenticate"]` (OpenAI's
  "both halves" of tool-level sign-in). Plus the earlier fixes: the
  resource document names the issuer exactly, and its cache life is 60 s.
- Preflight all green against production before the portal is opened;
  `manifest.md` at 1.10.2. Flip this entry to `Submitted` with the Case ID.
- Proof of success once published and re-added in ChatGPT: a second row
  in `oauthConsent` for the ChatGPT client, and a live tail showing
  OpenAI fetch `/.well-known/oauth-protected-resource/gpt` then the
  browser reach `/auth/oauth2/authorize`.

## 2026-09-25 — v2.2.0 — Prepared

**Case ID:** —
**Submitted by:** —
**Reviewer feedback:** —
**Action taken:**
- Supersedes the 1.12.2 `Prepared` entry below, which was never submitted:
  the live door reports 2.2.0 and the scan is the listing.
- What 2.2.0 changes for the reviewer: a custom domain reports its standing
  as one word (`unverified`, `unlinked`, `live`, `paused`) with the DNS
  result beside it as `verification`, both described in the output schema
  and named in `domains_get`'s description; the custom-domain flow ends at
  linking a deployment rather than at verification; `whoami` names the
  plan; and the deploy card's tile shows the deployment's screenshot, its
  App origin stated under `openai/widgetDomain` with `ui.domain` left to
  each host. The hints, the test cases, the auth halves and the demo
  credentials are unchanged from 1.12.1.
- Preflight green against production; `manifest.md` at 2.2.0. Flip this
  entry to `Submitted` with the Case ID.

## 2026-09-17 — v1.12.2 — Prepared

**Case ID:** —
**Submitted by:** —
**Reviewer feedback:** —
**Action taken:**
- Supersedes the 1.12.1 `Prepared` entry below, which was never submitted:
  1.12.2 landed on production on 2026-09-17 and the scan is the listing.
- What 1.12.2 changes for the reviewer: the deploy card frames the live
  site (a sandboxed frame of the deployment, no screenshot), shows the
  deployment's size and the time it has left in the platform's one spelling,
  and carries its wording at runtime; the catalogue, the hints, the auth
  halves and the demo credentials are unchanged from 1.12.1.
- Preflight green against production; `manifest.md` at 1.12.2. Flip this
  entry to `Submitted` with the Case ID.

## 2026-09-13 — v1.12.1 — Prepared

**Case ID:** —
**Submitted by:** —
**Reviewer feedback:** —
**Action taken:**
- Prepared as 1.11.0 first, then 1.12.0 the same day: every tool now publishes
  an `outputSchema` (imported from the shared type package, every field
  described), which removes the portal's per-tool advisory from the scan.
- Supersedes the 1.10.2 `Prepared` entry above, which was never submitted:
  the 1.11.0 catalogue landed on production the next day and the scan is
  the listing, so the newer generation is what gets scanned.
- What 1.11.0 changes for the reviewer: tool hints come from one registry
  row per tool (ten closed-world reads, `deployments_set` and `domains_set`
  destructive, only the two deletes idempotent); descriptions describe the
  tools rather than instruct the model; `whoami` returns exactly email,
  name, plan, usage and caps; `Origin` is validated on every door. The
  site password stays on every door: it is a setting for the site being
  published, not a credential OpenAI's data rule names (`docs/decisions.md`,
  2026-09-13).
- Demo credentials provided as a courtesy (`docs/decisions.md`,
  2026-09-14): `shipstatic.reviewer@gmail.com` ("ShipStatic Reviewer",
  account `479svhttge600ru7`, sponsored plan, label `review`); its Google
  password lives only in the portal field; API key hint `ship-…1580`,
  rotate both on approval. Seeded, all safe to mutate or delete:
  - `surging-whirl-34s7s7d.shipstatic.com`, a hello page (`review,hello`)
  - `lucid-ripple-z77vz8u.shipstatic.com`, two pages plus a stylesheet
    (`review,welcome`)
  - `airy-bot-mv3w7z3.shipstatic.com`, locked with the site password
    `hello-reviewer` (`review,private`)
  - `review-team.shipstatic.com`, a platform subdomain linked to the hello
    page, live
  - `reviewer.exampledomain.xyz`, a custom domain (DNS configured by the
    operator) linked to the welcome site, verified and live
  All five positive test cases are still anonymous. Preflight now asserts the full hint table and the absence of
  instructing descriptions.
- Preflight all green against production before the portal is opened;
  `manifest.md` at 1.12.1. Flip this entry to `Submitted` with the Case ID.
