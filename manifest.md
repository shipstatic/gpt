# Submission Manifest

The text you'll paste into OpenAI's plugin submission portal (OpenAI
renamed Apps to plugins in 2026-09; the portal, the directory and the
docs all say plugin now, and so does this file). Every portal field maps
to a labelled section here: plugin name, descriptions, category, URLs,
support contact, MCP server URL, version, tool surface, authentication,
release notes. Edit here, not in the portal, so the next submission can
diff against this file. `pnpm preflight` reads this file to verify that
the MCP server URL and Version match what's actually live, and that the
live server carries both halves of the authentication posture below.
`pnpm submission` derives `chatgpt-app-submission.json`, the file the
portal imports, from the pinned headers here, the live catalogue, and the
two data files under `submission/`.

**A published plugin is a SNAPSHOT.** OpenAI scans the MCP server when a
version is submitted and serves that reviewed metadata to every user;
it never reads the live `tools/list` again. So every change to the tool
surface is invisible to ChatGPT users until the plugin is rescanned,
resubmitted and republished. `docs/submission-history.md` records what
OpenAI holds; preflight reports how far behind live it is.

---

## Plugin name

ShipStatic

## Subtitle: `Deploy static sites instantly`

The portal's subtitle field (30 characters or fewer): one functional
phrase, not marketing copy. Read by `pnpm submission`.

## Short description

Deploy static websites instantly. No account, no API key, no setup.

## Long description

**One URL. Your agent ships.**

Ask ChatGPT to build something for the web (a landing page, a
portfolio, a single-file demo, a generated doc) and this plugin
publishes it instantly. You get a real `*.shipstatic.com` URL you
can share immediately.

Free and anonymous: no install, no signup, no API key, with 3 days
to claim ownership and keep the site permanently. Connect a
ShipStatic account when you want the rest: custom domains, listing
everything you have published, and sites that never expire. The
plugin starts that sign-in for you.

## Category: `DEVELOPER_TOOLS`

**Developer Tools**, in the portal's own enum so `pnpm submission` can
state it. Single category. The App's identity is "deploy static sites from
agents," which sits cleanly in developer tooling regardless of the
exact taxonomy OpenAI's dashboard exposes.

## Localization

en-US (English, United States)

Single locale at launch. No translated descriptions or test prompts.
Future locales are TBD; resubmission would update this section when
added.

---

## MCP server URL: `https://mcp.shipstatic.com/gpt`

The `/gpt` path is deliberately distinct from `/` so deploys tag
`via: 'gpt'` for analytics, and so the server can answer a credential
refusal in the shape OpenAI's hosts read. Same MCP server impl on both
paths. URL type: Universal (one fixed URL for every user).

## Version: `2.2.0`

Tracked by `cloudflare/mcp/src/version.ts` `VERSION` constant. The live
endpoint reports this value on `initialize`. `pnpm preflight` enforces
this match.

## Tool surface

Fifteen tools. **`deployments_upload`** is the one that needs no account:
it is what the review team exercises, and it works with no credentials,
no MFA and no setup. The other fourteen (listing, custom domains, account
operations) answer once an account is connected over OAuth, which ChatGPT
starts from the credential refusal described under Authentication.

Every tool's hints come from one registry row per tool in the server
(`@shipstatic/mcp` 2.2.0), so they state what the platform measured:
the ten reads are read-only and closed-world (they reach ShipStatic and
nothing beyond it); `deployments_set` and `domains_set` replace state and
are marked destructive; the two deletes are destructive and idempotent;
only what changes public internet state (a deploy, a domain link, a
verification, the deletes) is open-world. `submission/justifications.json`
carries one sentence per hint per tool and the build refuses a sentence
whose value the live server does not declare.

Every tool publishes an `outputSchema`, imported from the platform's shared
type package rather than written in the server, with every field described;
every result carries `structuredContent` beside its text. The portal's
"Recommended: add an outputSchema" advisory therefore applies to no tool.

Annotations of `deployments_upload`, the tool a reviewer runs:
- `readOnlyHint: false`: creates a deployment
- `destructiveHint: false`: outcomes are reversible (the deploy can be
  left to expire)
- `openWorldHint: true`: writes to publicly-visible internet state

`deployments_upload` accepts an optional `password` that locks the
published site behind a visitor unlock prompt: the same site-protection
feature Vercel and Netlify each call Password Protection, and Vercel's API
takes as a `password` field. It is a setting the user chooses for a site
they are publishing, sent only to ShipStatic's own API, stored hashed, and
shown back to the user so they can share it; it is not a credential of the
user's to any account or service. The result's `password` boolean reports
whether a deployment is protected.

## Authentication: partial (the server starts without authentication; individual tools prompt on demand)

**Demo credentials are provided, though the rule does not require them.**
OpenAI's rule is conditional, verbatim: "provide reviewer-ready demo
credentials if the server requires sign-in." This server does not:
publishing, the plugin's whole purpose, works with no account at all, and
every test case in the submission runs anonymously. A populated reviewer
account is handed over anyway, so the fourteen account tools can be
explored without setup: a Google login (the address and password go in the
portal's demo-credentials field and nowhere else), no MFA, no email
confirmation, already signed in to ShipStatic once, on a sponsored plan so
every tool succeeds against paid-tier caps. It holds three labelled
deployments (a hello page, a two-page site with a stylesheet, a
password-protected page whose site password is `hello-reviewer`), one live
platform subdomain and one live custom domain, all safe to change or delete. The account's
password and API key are rotated the day the listing is approved.

The other fourteen tools need a connected ShipStatic account, and the
server states that in the two places OpenAI's auth guide names, both of
which Scan Tools imports:

- **Every tool declares `securitySchemes`.** `deployments_upload` is
  `noauth` + `oauth2` (works without an account, does more with one); the
  fourteen account tools are `oauth2`.
- **A refusal carries the sign-in.** Calling an account tool without a
  credential answers an error result whose `_meta["mcp/www_authenticate"]`
  names the authorization server, and ChatGPT opens its sign-in from it.

Registration is dynamic (DCR), the authorization server is
`https://api.shipstatic.com/auth`, and the protected-resource document is
`https://mcp.shipstatic.com/.well-known/oauth-protected-resource/gpt`.
Account features are self-serve: a reviewer who chooses to try them signs
in with a Google account or with any email address (a magic link to that
inbox), and a free ShipStatic account is created on first sign-in. Nothing
is provisioned and nothing is handed over.

## Release notes

Paste for the version above, then keep this section current:

> Update to 2.2.0. Since the published 1.0.0: account features over OAuth
> (listing and managing deployments, custom domains with DNS guidance,
> account details), optional expiry (`ttl`) on a deploy, and per-tool
> authentication metadata so ChatGPT offers sign-in only where an account
> is needed. Tool annotations now state each tool's real effect (reads are
> read-only and closed-world; replacing and deleting are marked
> destructive), descriptions describe the tools, the account tool
> returns only email, name, plan, usage and caps, and every tool publishes
> an output schema with every field described. A custom domain now reports
> its standing as one word, `unverified`, `unlinked`, `live` or `paused`,
> saying what the domain needs from its owner, and carries the DNS result
> separately as `verification`, so an assistant reads the next step rather
> than working it out. The deploy card shows the deployment's own
> screenshot and states its size and the time it has left the way every
> ShipStatic surface does. Anonymous deploys are unchanged.

---

## Company URL

`https://shipstatic.com`

## Privacy policy URL

`https://shipstatic.com/privacy`

Disclosure covers: anonymous deploys, expiry after 3 days, screenshot capture
and retention, claim-flow account creation, no PII collection on the
anonymous path. Draft source: `policy/privacy.md`.

## Terms of service URL (if dashboard requests it)

`https://shipstatic.com/terms`

Per the OpenAI submission docs we read, only the Privacy policy URL
is explicitly required. The terms URL is provided if the dashboard
asks for it. Draft source: `policy/terms.md`. Content-moderation
stance and takedown process: `policy/content-moderation.md`.

## Support contact

`hello@shipstatic.com`

Aligned with the support contact on `https://shipstatic.com/terms`.
Privacy inquiries route to `privacy@shipstatic.com`; abuse reports
route to `abuse@shipstatic.com`. All three addresses are operated by
Enhanced SRL (Romania, EU), the data controller.
