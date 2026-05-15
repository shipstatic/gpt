# Privacy Policy — Draft Update

**Status:** Proposed update to the existing
`https://shipstatic.com/privacy` page. The live page (last updated
2026-02-24) covers the authenticated path well but does **not**
disclose the anonymous-deploy flow that the hosted MCP / ChatGPT App
exposes. This draft preserves the live page's structure and
controller info, and inserts the missing anonymous-flow disclosures.

Deployment of an updated `/privacy` page happens in `web/www/` —
separate engineering work. Humans approve before publishing.

---

## Controller (unchanged from live)

Enhanced SRL (Romania, EU) operates ShipStatic and controls your data.

## What we collect

**Authenticated deploys** (signed in via Google):
- Your name and email, via Google Sign-In, to provide the service.
- Cloudflare processes your IP address and request metadata to deliver
  the service. These are necessary to fulfill our contract with you.

**Anonymous deploys** (no account — via the hosted MCP at
`mcp.shipstatic.com`, the CLI without an API key, or the web app
without sign-in):

- The **files you upload** (HTML, CSS, JS, images, fonts — whatever
  makes up your static site). We host them at a `*.shipstatic.com`
  address and serve them via Cloudflare.
- A **screenshot** of how the deployed site looks, used for the
  preview card. Taken once, when you deploy.
- **Your IP address**, to prevent abuse and apply rate limits.
- A **deployment ID** and a **claim link**. The ID identifies your
  site; the claim link is your way to convert it into a permanent,
  account-owned deploy within 3 days.
- **Nothing else.** No name, no email, no profile data — there's no
  account to attach those to.

After **3 days**, unclaimed anonymous deploys and everything that
went with them (files, screenshot, metadata) are permanently deleted.

## Payments

Payments are handled entirely by Creem.io as Merchant of Record. We
do not collect or store any payment data.

## Cookies

We use essential cookies for authentication. These are necessary for
the service to function. With your consent, we also use Google
Analytics cookies for usage analytics and Sentry for error tracking,
to improve the product. We only send marketing emails if you opt in.
You can withdraw analytics consent at any time through the cookie
banner.

Hosted deployments (your sites at `*.shipstatic.com` or custom
domains) are served as-is — any cookies or analytics they include are
yours, not ours.

## Sub-processors

Google (authentication and analytics), Cloudflare (infrastructure,
including R2 storage and Browser Rendering for screenshots), Sentry
(error tracking), and Creem.io (name and email for billing). We do
not sell your data.

Google, Cloudflare, and Sentry operate outside the EEA under Standard
Contractual Clauses.

## Retention

- Account data is kept until you delete your account.
- Analytics and error logs are kept for 90 days.
- IP addresses associated with anonymous deploys are kept in
  operational logs for up to 90 days.
- Anonymous deploys (files, screenshot, metadata) are deleted 3 days
  after creation unless claimed.

## Your rights

You can access, correct, delete, export, or restrict your data at any
time by emailing `privacy@shipstatic.com`. We respond within 30 days.
You also have the right to lodge a complaint with a data protection
authority.

For anonymous deploys, there is no account to query — the deploy ID
and claim URL are your only references. Deletion can be requested
via `privacy@shipstatic.com` with the deploy ID, and we honour
requests within the same 30-day window.

## Contact

Questions? `privacy@shipstatic.com`.
