# ShipStatic in ChatGPT

ShipStatic's plugin in OpenAI's Plugins Directory, shared by ChatGPT and
Codex. It connects one MCP server, the hosted door at
`https://mcp.shipstatic.com/gpt`.

- **The listing:** https://chatgpt.com/plugins/plugin_asdk_app_6a06f62b2f50819181136d58192063d1
- **Where it's managed:** https://platform.openai.com/plugins/manage/plugin_asdk_app_6a06f62b2f50819181136d58192063d1

This repo holds no product code. The door is served by the hosted MCP in
`cloudflare/mcp`. This repo holds the listing's package, in the Codex layout
OpenAI's release ZIP uses, and a preflight that checks the door against what
OpenAI checks.

```bash
pnpm preflight    # the live /gpt door and the listing's links; must pass
```

## What lives where

| Path | Purpose |
|---|---|
| `.codex-plugin/plugin.json` | The listing: name, descriptions, capabilities, category, starter prompts, links, logo and version, and under `extensions.com.openai` the review cases and release notes. It names the MCP declaration and the skills beside it. |
| `.mcp.json` | The one MCP server, by its URL, which the portal requires for the review cases. Never its authentication: that is the app's, in the portal. |
| `skills/publish-online/SKILL.md` | The skill: how to put a report, page, dashboard or small app online with `deployments_upload`, with no account, what to tell the user, and how to handle a password, changes and refusals. |
| `assets/icon-1024.png`, `assets/icon-480.png` | The logo and the composer icon the manifest names. |
| `scripts/preflight.mjs` | Checks the live door (tools, hints, output schemas, the card, both halves of sign-in, PKCE) and the package (the portal's field limits, its links, its version against the door's, its connection mode against what the door's tools declare, and every tool its review cases and skills name). A green run is not the portal's scan or a reviewer's judgement. |
| `.github/workflows/ci.yml` | Runs preflight on every push and weekly, against production. A failure reaches the alerts channel. |

## How updates reach ChatGPT

**Tools follow the server.** OpenAI scans the door every day. Tool changes go
live once its checks pass, with no new listing version and no publish step.
A change it flags is held, and that tool keeps its last approved definition.
The server's instructions are checked with the tools they affect, so they
can be held too. So the server has to stay compatible with the approved
schemas until the held update is live. ChatGPT may keep the card's HTML for
up to an hour after a compatible change, so a card change that would break
an older host needs a new resource URI.

**After every hosted MCP release:**

1. Run `pnpm preflight`. A failure here is likely a change the scan would
   flag.
2. In the management page, open **MCPs**, then the server, then **Issues**,
   and select **Rescan**. Waiting for the daily scan also works.
3. Read the result. A held tool shows its **Held update** beside its **Live
   definition**. Fix it on the server and rescan, or appeal.
4. Check what ChatGPT actually got in a new conversation, not the version
   the server reports.

**The listing's version is the MCP version it was published with.** Between
listing uploads the door runs ahead of it, and preflight says so without
failing.

**To change the listing** (its text, starter prompts, links, logo, skills or connection):

1. Edit `.codex-plugin/plugin.json`, `.mcp.json` or a skill, and set
   `version` to the version the door reports now. Run `pnpm preflight`.
2. Zip the package from the repo root, every file the manifest names included:
   `zip -r -X shipstatic.zip .codex-plugin .mcp.json assets skills`.
3. In the management page, select **Upload plugin to make changes**, upload
   the ZIP, and resolve what **Metadata & Skills** reports.
4. Open **MCPs** and check the saved connection: the URL is the `/gpt` door
   and the authentication mode is `mixed`, which preflight names from the
   door's tools. A change of mode is made there, through the app, never in
   the package: the portal refuses a package that overrides an existing
   app's authentication. Don't select
   **Reconnect**, and never delete or rotate the OAuth client: every account
   already connected in ChatGPT signs in through it. If the mode isn't shown,
   ask OpenAI support to confirm it before submitting.
5. Submit for review. Once approved, publish it.
6. In a ChatGPT account that has never connected ShipStatic, publish with no
   account, then ask for an account feature and connect. A sign-in failing
   there with an invalid redirect means ChatGPT moved to its stable redirect
   URI (`https://chatgpt.com/connector_platform_oauth_redirect`), which our
   authorization server's issuer identification makes it entitled to: the
   connection then needs a client that allows it, which is a support
   question, never a deleted client.

The MCP server's URL can't change in this flow. Changing it means asking
OpenAI support.

## The reviewer account

Each review runs on a ShipStatic account we keep for it, and OpenAI asks
that it stay usable for later reviews. Its credentials go in the portal's
Review details and nowhere else.

- **Sign-in:** `shipstatic.reviewer@gmail.com` (display name "ShipStatic
  Reviewer"), the owner of a sponsored account. It signs in with a
  ShipStatic password. It's the one address that's shown a password field,
  because OpenAI's reviewers can't use codes, magic links or MFA. Its
  password changes only if it leaks, and Review details is updated the same
  day.
- **What it holds** (all safe to change or delete):
  - `surging-whirl-34s7s7d.shipstatic.com`, a hello page (`review`, `hello`)
  - `lucid-ripple-z77vz8u.shipstatic.com`, two pages and a stylesheet
    (`review`, `welcome`)
  - `airy-bot-mv3w7z3.shipstatic.com`, locked with the site password
    `hello-reviewer` (`review`, `private`)
  - `review-team.shipstatic.com`, a platform domain on the hello page
  - `reviewer.exampledomain.xyz`, a custom domain on the welcome site

## Decisions

- **One door for ChatGPT.** The `/gpt` path serves the same server as `/`.
  It exists so deploys from ChatGPT carry `via: 'gpt'`, and so a sign-in
  refusal takes the shape ChatGPT reads.
- **Publishing needs no account; everything else does.** `deployments_upload`
  works without an account (`noauth` and `oauth2`): with none, the site gets
  a claim link and lasts 3 days, and with one, it goes to the account. The
  other fourteen tools need an account (`oauth2`). ChatGPT offers its sign-in
  only when both halves are there: the tool's `securitySchemes`, and a
  refusal carrying `_meta["mcp/www_authenticate"]`.
- **The connection is `mixed`, set in the portal.** Under `oauth`, ChatGPT
  links the account before the first call, whatever each tool declares, so
  nobody publishes without signing in. `mixed` lets a person publish straight
  away and connect only when they ask for something an account holds. The
  mode belongs to the app in the portal: a package may not override an
  existing app's authentication, so `.mcp.json` names the one server by its
  URL (the review cases need exactly one) and carries no auth. Preflight
  holds both halves, and names the mode the door's tools need for a person
  to check under MCPs.
- **The site password stays, on our reading of the policy.** OpenAI's data
  rules name "passwords" among the credentials a plugin must not collect, and
  don't carve out this case. Our reading: a password the user chooses, or the
  agent makes up, to lock a site they are publishing is a setting for that
  site, sent only to ShipStatic and stored hashed, not their credential to
  any service. The 2.3.3 review approved the listing with the feature named
  in its description. The skill never asks for a password the user uses
  elsewhere. If a review rules otherwise, the field leaves the `/gpt` door
  and the feature stays a console setting.
- **The screenshot of a protected site shows the site.** The card's tile is
  the deployment's screenshot, rendered unlocked, at a URL derived from a
  secret and returned only to whoever published it or holds the account, who
  already have the content. It is a capability URL, like the claim link,
  which grants more. The listing's promise, that visitors type the password
  before they see anything, is about the people the link is shared with, and
  it holds. Telling the publisher about a URL only they receive would add
  worry, not protection; if protected previews should show the lock screen
  instead, that is a change in the screenshot worker, not in this copy.
- **`via` and `status` stay in results.** `via` tells people where a deploy
  came from in the console. `status` is the deploy's state. Neither is
  telemetry.
- **Developer Tools only, English only.**
- **One skill, publishing online.** The server's instructions say what an
  agent should do in a sentence; the skill is the workflow around
  `deployments_upload` for anything that can be HTML (a report, a page, a
  dashboard, a small web app): the user's own instructions first, complete
  static files, one upload per version, the links and the password told
  back, a change published again, a server-side request and restricted data
  declined. It ships in the package rather than from the server,
  because OpenAI imports a server's skills as a snapshot at scan time and
  does not read them at runtime, so serving them adds machinery and no
  freshness. The estate's other `SKILL.md` teaches the `ship` CLI, which
  ChatGPT can't run, so it isn't one of these.
- **Refused, each until the thing named happens:**
  - **`openai/subject` as the rate-limit caller.** Anonymous deploys on `/gpt`
    are metered per OpenAI egress address, and the busiest address peaked at
    8 deploys in an hour against a budget of 100, so nobody is throttled.
    Trusting a per-user value needs ChatGPT's client verified (mTLS) at the
    edge. Reopen when a ChatGPT user is refused by the per-caller budget; the
    mechanism belongs to the root backlog's "authenticate `X-Caller`".
  - **A profile tool** (`openai/profile`). ChatGPT connects accounts without
    one; `whoami` stays as it is. Reopen when people connect more than one
    ShipStatic account in ChatGPT and need to tell them apart.
  - **`agents/openai.yaml` for the skill.** OpenAI marks it optional, and a
    dependency on the server the plugin already bundles could add a second
    connection. Reopen when the skill scan asks for it.
- **OpenAI's words.** This repo says plugin, Plugins Directory and MCP
  server URL, as OpenAI does. The repo name `gpt` and the `/gpt` door are
  ours.

## License

MIT
