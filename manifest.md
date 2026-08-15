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

## Connector URL: `https://mcp.shipstatic.com/gpt`

The `/gpt` path is deliberately distinct from `/` so deploys tag
`via: 'gpt'` for analytics. Same MCP server impl on both paths.

## Version: `1.3.1`

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

## OAuth credentials

**None are required, and none need to be issued to the review team.**
Publishing — the App's whole purpose — works with no account at all, so a
reviewer connects and deploys without credentials, MFA, or setup.

The endpoint does support OAuth for the account tools, and a client
starts that flow itself from a `401` challenge; there is nothing for us
to hand over, because registration is dynamic. Stated rather than
omitted, because a reviewer who probes the other fourteen tools will
meet that challenge and should not be surprised by it.

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

`support@shipstatic.com`

Confirmed via the live `https://shipstatic.com/terms` page. Privacy
inquiries route to `privacy@shipstatic.com`; abuse reports route to
`abuse@shipstatic.com`. All three aliases are operated by Enhanced
SRL (Romania, EU), the data controller.
