# Listing Manifest

The one place the plugin's listing is written. OpenAI's directory takes a
plugin as a ZIP (`plugin.json`, `mcp.json`, the images they name), and
`pnpm package` builds that ZIP from this file, `submission/test-cases.json`
and the live catalogue: every pinned header (`## Name: \`value\``) and
every section below maps to a field of `plugin.json`, so the JSON is never
edited by hand and the diff between two uploads is the review record.
`pnpm preflight` holds the committed JSON to this file and the live `/gpt`
door to what OpenAI's scan checks.

**Two things move on two clocks.** The PACKAGE (this file, the test cases,
the images) moves only when a listing fact changes, and each move is a new
ZIP with a new `## Version`. The HOSTED TOOLS move with the MCP server in
another repo: after the first publication OpenAI scans the server daily and
takes eligible tool changes live on its own, holding a flagged change
against the last approved definition. No package upload follows an MCP
release; a rescan may be requested the day one lands.

---

## Package name: `shipstatic`

The manifest's `name`: a stable identifier, lowercase, never shown. Distinct
from the plugin name below.

## Version: `1.1.0`

The PACKAGE version, not the MCP server's. It moves when this file, the test
cases or the images change, and each upload needs a higher one. The
directory's 1.0.0 was published through the previous submission form; this
is the first package upload. The MCP server reports its own version on
`initialize`, and preflight prints it for the record.

## Plugin name

ShipStatic

## Subtitle: `Deploy static sites instantly`

The listing's `shortDescription` (30 characters or fewer): one functional
phrase, not marketing copy.

## Long description

**One URL. Your agent ships.**

Ask ChatGPT to build something for the web (a landing page, a
portfolio, a single-file demo, a generated doc) and this plugin
publishes it instantly. You get a real `*.shipstatic.com` URL you
can share immediately.

No install, no signup, no API key, with 3 days to claim ownership
and keep the site permanently. Connect a ShipStatic account when you
want the rest: custom domains, listing everything you have published,
and sites that never expire. The plugin starts that sign-in for you.

## Developer name: `ShipStatic`

The `developerName` shown on the listing. The directory's publisher name
comes from the verified identity chosen at upload, not from this field.

## Category: `Developer Tools`

The category TITLE as the dashboard spells it, which is what the manifest
takes. Single category: the plugin's identity is "deploy static sites from
agents", which sits cleanly in developer tooling.

## Capabilities

The listing's `capabilities` labels (at most 20, 120 characters each):

- Publish a static site to a live URL
- List and manage your deployments
- Connect a custom domain

## Default prompts

The starter prompts the directory shows in place of screenshots (at most 3,
128 characters each, unique, no @mentions):

- Create a landing page for my coffee shop and publish it online.
- Deploy this HTML page and give me a link I can share.
- List the sites in my ShipStatic account.

## Localization

en-US (English, United States)

Single locale at launch. No translated subtitles or descriptions
(`publication.translations` is omitted). Future locales are TBD.

---

## MCP server URL: `https://mcp.shipstatic.com/gpt`

The one server `mcp.json` declares, as `streamable-http`. The `/gpt` path
is deliberately distinct from `/` so deploys tag `via: 'gpt'` for analytics,
and so the server can answer a credential refusal in the shape OpenAI's
hosts read. Same MCP server implementation on both paths. Only one MCP
server can be connected per plugin, and its URL cannot change after the
first connection without contacting support.

## Tool surface

Fifteen tools. **`deployments_upload`** needs no account: it is what an
anonymous reviewer exercises first, and it works with no credentials, no
MFA and no setup. The other fourteen (listing, custom domains, account
operations) answer once an account is connected over OAuth, which ChatGPT
starts from the credential refusal described under Authentication.

Every tool's hints come from one registry row per tool in the server, so
they state what the platform measured: the ten reads are read-only and
closed-world (they reach ShipStatic and nothing beyond it);
`deployments_set` and `domains_set` replace state and are marked
destructive; the two deletes are destructive and idempotent; only what
changes public internet state (a deploy, a domain link, a verification, the
deletes) is open-world. OpenAI no longer takes justifications for the
hints; its scan evaluates them, and preflight compares the live door to this
table so a disagreement is found here first.

Every tool publishes an `outputSchema`, imported from the platform's shared
type package rather than written in the server, with every field described;
every result carries `structuredContent` beside its text.

`deployments_upload` accepts an optional `password` that locks the
published site behind a visitor unlock prompt: the same site-protection
feature Vercel and Netlify each call Password Protection, and Vercel's API
takes as a `password` field. It is a setting the user chooses for a site
they are publishing, sent only to ShipStatic's own API, stored hashed, and
shown back to the user so they can share it; it is not a credential of the
user's to any account or service. **Whether OpenAI's restricted-data rule
reads it that way is an open question** (`docs/decisions.md`, pending): the
rule names "passwords" without qualifying whose, and no ruling exists either
way. The field stays until one does, and no test case exercises it.

## Authentication: partial (the server starts without authentication; individual tools prompt on demand)

**Reviewer credentials are required, and they are entered in the portal's
Review details, never in the package** (ZIP metadata refuses
`test_credentials` and `reviewer_instructions`). OpenAI's submission page:
reviewer credentials are needed "if sign-in is required", the account
"should work immediately without MFA approval, email or SMS codes, magic
links, or private-network access", and "keep the test account and sample
data available for subsequent reviews". Fourteen of the fifteen tools need
a signed-in account and four of the five positive test cases exercise them,
so this server requires sign-in for review purposes whatever
`deployments_upload` needs.

The account: `shipstatic.reviewer@gmail.com`, display name "ShipStatic
Reviewer", a ShipStatic account on the sponsored plan so every tool succeeds
against paid-tier caps. It signs in to ShipStatic with a password of its own,
set by us, which goes in the portal's credentials field and nowhere else.
The address is also a Google login we own, a second way in that the reviewer
never needs. It holds
three labelled deployments (a hello page, a two-page site with a
stylesheet, a page locked with the site password `hello-reviewer`), one live
platform domain and one live custom domain, all safe to change or
delete; `docs/submission-history.md` names them.

Sign-in instructions for the portal, in the reviewer's order: run a test
case that needs the account; ChatGPT offers to connect ShipStatic; enter the
reviewer address in the email field; a password field appears; enter the
password and continue (a "Verify you are human" checkbox may appear first
and takes one click; it asks nothing of the reviewer's identity); the plugin
is connected and the case completes. No
MFA, no code, no magic link, no other company's sign-in: ShipStatic itself
is passwordless, and the reviewer account is the one kind that signs in by
password, for exactly this rule.

**Two things this arrangement owes.** The account stays as it is for every
later review: its password is rotated only if it leaks, never on approval,
and the portal is updated the day it changes. And the sign-in must be proven
from a fresh device before submission (a clean browser profile, no session
of any kind), by password, through ChatGPT itself: the path the reviewer
walks, with nothing in it that another company can challenge.

The server states its posture in the two places OpenAI's auth guide names,
both of which the scan imports:

- **Every tool declares `securitySchemes`.** `deployments_upload` is
  `noauth` + `oauth2` (works without an account, does more with one); the
  fourteen account tools are `oauth2`.
- **A refusal carries the sign-in.** Calling an account tool without a
  credential answers an error result whose `_meta["mcp/www_authenticate"]`
  names the authorization server, and ChatGPT opens its sign-in from it.

Registration is dynamic (DCR), the authorization server is
`https://api.shipstatic.com/auth`, and the protected-resource document is
`https://mcp.shipstatic.com/.well-known/oauth-protected-resource/gpt`.

## Demo recording URL: `TBD`

Required for MCP review: a reviewer-accessible recording walking the five
positive and three negative cases, on desktop and on mobile. Unset, the
package omits the field and preflight names it as owed; set, preflight checks
only that the URL answers, and a person checks that it plays and shows what
it should. Record it after the fresh-device sign-in proof, so the recording
shows the sign-in the reviewer will see.

## Release notes

The `publication.release_notes` for this package version, the blockquote
alone:

> First package upload, replacing the 1.0.0 listing made through the
> previous submission form. The MCP server now offers account features over
> OAuth beside anonymous publishing: listing and managing deployments,
> custom domains with DNS guidance, and account details, with sign-in
> offered only where an account is needed. Every tool states its effect in
> its annotations and publishes an output schema. Anonymous deploys are
> unchanged.

---

## Company URL: `https://shipstatic.com`

## Support URL: `https://www.shipstatic.com/support`

The listing's `supportURL`, an https page rather than an address. The
address below is the same team.

## Privacy policy URL: `https://shipstatic.com/privacy`

Disclosure covers: anonymous deploys, expiry after 3 days, screenshot capture
and retention, claim-flow account creation, no PII collection on the
anonymous path. Draft source: `policy/privacy.md`.

## Terms of service URL: `https://shipstatic.com/terms`

Required for MCP review with the three URLs above. Draft source:
`policy/terms.md`. Content-moderation stance and takedown process:
`policy/content-moderation.md`.

## Support contact: `hello@shipstatic.com`

The manifest's `author.email`. Aligned with the support contact on
`https://shipstatic.com/terms`. Privacy inquiries route to
`privacy@shipstatic.com`; abuse reports route to `abuse@shipstatic.com`. All
three addresses are operated by Enhanced SRL (Romania, EU), the data
controller.
