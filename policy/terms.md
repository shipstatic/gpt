# Terms of Service — Draft Update

**Status:** Proposed update to the existing
`https://shipstatic.com/terms` page. The live page (last updated
2026-02-24) is correctly scoped to the authenticated experience; this
draft adds the anonymous-deploy specifics that the hosted MCP /
ChatGPT App relies on, and keeps the live page's structure,
controller, jurisdiction, and liability framing intact.

Deployment of an updated `/terms` page happens in `web/www/`. Humans
approve before publishing.

---

## Acceptance (unchanged from live)

Enhanced SRL (Romania, EU) operates ShipStatic. By using it, you
agree to these terms and our Privacy Policy.

## What ShipStatic provides

ShipStatic lets you host static websites — on a `*.shipstatic.com`
subdomain or on your own domain. The service comes in two modes:

- **Anonymous deploys** (free, no account) — via the hosted MCP at
  `mcp.shipstatic.com`, the CLI without an API key, or the web app
  without sign-in. Deploys expire 3 days after creation unless claimed.
- **Authenticated deploys** (account-tied) — via the CLI/SDK with an
  API key, the web app signed in, or any integration with a
  `SHIP_API_KEY` configured. Deploys persist until you delete them.

You keep full ownership of your content. We don't claim any rights
over what you host. By uploading content, you grant us a license to
host, store, cache, and serve it as part of providing the service.

## Your responsibility

You are responsible for the content you host. Don't use ShipStatic to
host anything illegal or to harm others. We may suspend or terminate
accounts (and remove anonymous deploys) that violate this without
notice.

## Anonymous-deploy specifics

- 3-day expiry unless claimed via the deploy's claim URL.
- File limits: 20 MB per file, 50 MB total per deploy, 500 files per
  deploy.
- Rate limits apply globally to prevent abuse. If you legitimately
  need higher throughput, create an account.
- A claim URL converts an anonymous deploy into a permanent
  account-tied one. The first account to use a claim URL owns the
  deploy.

## Content moderation

If you believe content hosted on ShipStatic is illegal or infringes
your copyright, report it to `abuse@shipstatic.com`. We will review
valid notices and act in accordance with the EU Digital Services
Act. If we restrict your content, we will inform you with a reason.

See our content-moderation operations note for response timelines
and process.

## Service availability

ShipStatic is provided as-is. We make no guarantees about uptime,
reliability, or fitness for any purpose.

## Liability

Our liability to you is limited to the amount you paid us in the last
30 days.

## Changes

We may update these terms at any time. Continued use means acceptance.

## Governing law (unchanged from live)

This Agreement is governed by the laws of Romania. Any disputes
arising from it shall be subject to the exclusive jurisdiction of the
courts of Romania, except where applicable consumer protection law
requires otherwise.

## Contact

Questions? `support@shipstatic.com`.
