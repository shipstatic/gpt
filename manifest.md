# Submission Manifest

The text you'll paste into the OpenAI dashboard. Every dashboard field
maps to a labelled section here — App name, descriptions, category,
URLs, support contact, connector URL, version, tool surface, OAuth
status. Edit here, not in the dashboard, so the next submission can
diff against this file. `pnpm preflight` reads this file to verify
that the Connector URL and Version match what's actually live.

---

## App name

ShipStatic

## Short description

Deploy static websites instantly. No account, no API key, no setup.

## Long description

**One URL. Your agent ships.**

Ask ChatGPT to build something for the web — a landing page, a
portfolio, a single-file demo, a generated doc — and this App
publishes it instantly. You get a real `*.shipstatic.com` URL you
can share immediately.

Free and anonymous, with a 3-day window to claim ownership and keep
the site permanently. No install, no signup, no API key. For custom
domains and longer-lived sites, install the `@shipstatic/mcp` package
for the full toolset (custom domains, listing, account-tied ops).

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

## Connector URL: `https://mcp.shipstatic.com/gpt`

The `/gpt` path is deliberately distinct from `/` so deploys tag
`via: 'gpt'` for analytics. Same MCP server impl on both paths.

## Version: `0.6.0`

Tracked by `cloudflare/mcp/src/version.ts` `VERSION` constant. The live
endpoint reports this value on `initialize`. `pnpm preflight` enforces
this match.

## Tool surface

A single tool: **`deployments_upload`** — anonymous-only on this
endpoint, by design.

Annotations (review team checks these):
- `readOnlyHint: false` — creates a deployment
- `destructiveHint: false` — outcomes are reversible (the deploy can
  be left to expire)
- `openWorldHint: true` — writes to publicly-visible internet state

## OAuth credentials

None. The hosted endpoint is anonymous by design. The review team can
connect without credentials, MFA, or setup.

---

## Company URL

`https://shipstatic.com`

## Privacy policy URL

`https://shipstatic.com/privacy`

Disclosure covers: anonymous deploys, 3-day expiry, screenshot capture
and retention, claim-flow account creation, no PII collection on the
anonymous path. Draft source: `policy/privacy.md`.

## Terms of service URL (if dashboard requests it)

`https://shipstatic.com/terms`

Per the OpenAI submission docs we read, only the Privacy policy URL
is explicitly required. The terms URL is provided if the dashboard
asks for it. Draft source: `policy/terms.md`. Content-moderation
stance and takedown process: `policy/content-moderation.md`.

## Support contact

`support@shipstatic.com`

Confirmed via the live `https://shipstatic.com/terms` page. Privacy
inquiries route to `privacy@shipstatic.com`; abuse reports route to
`abuse@shipstatic.com`. All three aliases are operated by Enhanced
SRL (Romania, EU), the data controller.
