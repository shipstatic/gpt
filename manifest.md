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

**A published plugin is a SNAPSHOT.** OpenAI scans the MCP server when a
version is submitted and serves that reviewed metadata to every user;
it never reads the live `tools/list` again. So every change to the tool
surface is invisible to ChatGPT users until the plugin is rescanned,
resubmitted and republished. `docs/submission-history.md` records what
OpenAI holds; preflight reports how far behind live it is.

---

## Plugin name

ShipStatic

## Short description

Deploy static websites instantly. No account, no API key, no setup.

## Long description

**One URL. Your agent ships.**

Ask ChatGPT to build something for the web — a landing page, a
portfolio, a single-file demo, a generated doc — and this App
publishes it instantly. You get a real `*.shipstatic.com` URL you
can share immediately.

Free and anonymous: no install, no signup, no API key, with 3 days
to claim ownership and keep the site permanently. Connect a
ShipStatic account when you want the rest — custom domains, listing
everything you have published, and sites that never expire — and the
App starts that sign-in for you.

## Category

**Developer Tools**

Single category. The App's identity is "deploy static sites from
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

## Version: `1.10.2`

Tracked by `cloudflare/mcp/src/version.ts` `VERSION` constant. The live
endpoint reports this value on `initialize`. `pnpm preflight` enforces
this match.

## Tool surface

Fifteen tools. **`deployments_upload`** is the one that needs no account
— it is what the review team exercises, and it works with no credentials,
no MFA and no setup. The other fourteen (listing, custom domains, account
operations) answer once an account is connected over OAuth, which the
client initiates from a `401` challenge.

Annotations below describe `deployments_upload`, the tool a reviewer runs:
- `readOnlyHint: false` — creates a deployment
- `destructiveHint: false` — outcomes are reversible (the deploy can
  be left to expire)
- `openWorldHint: true` — writes to publicly-visible internet state

## Authentication: partial (the server starts without authentication; individual tools prompt on demand)

**No demo credentials are required, and none need to be issued to the
review team.** Publishing, the plugin's whole purpose, works with no
account at all, so a reviewer connects and deploys without credentials,
MFA, or setup.

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
`https://mcp.shipstatic.com/.well-known/oauth-protected-resource/gpt`. A
reviewer who signs in gets a magic link to the address they enter; nothing
to hand over.

## Release notes

Paste for the version above, then keep this section current:

> Update to 1.10.2. Since the published 1.0.0: account features over OAuth
> (listing and managing deployments, custom domains with DNS guidance,
> account details), optional expiry (`ttl`) on a deploy, build settings,
> and per-tool authentication metadata so ChatGPT can offer sign-in only
> where an account is needed. Anonymous deploys are unchanged.

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
