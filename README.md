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
| `.codex-plugin/plugin.json` | The listing: name, descriptions, capabilities, category, starter prompts, links, logo and version. It names the MCP declaration and the skills beside it. |
| `skills/publish-a-site/SKILL.md` | The skill: how to put what the user asked for online with `deployments_upload`, with no account, what to tell them, and how to handle a password, changes and refusals. |
| `.mcp.json` | The one MCP server, the `/gpt` door, and how ChatGPT connects to it: `mixed`, public and OAuth-protected access. |
| `assets/icon-1024.png`, `assets/icon-480.png` | The logo and the composer icon the manifest names. |
| `scripts/preflight.mjs` | Checks the door (tools, hints, output schemas, the card, both halves of sign-in) and the listing (its links answer, its version against the door's, its connection mode against what the door's tools declare, and every tool its skills name). |
| `.github/workflows/ci.yml` | Runs preflight on every push and weekly, against production. A failure reaches the alerts channel. |

## How updates reach ChatGPT

**Tools follow the server.** OpenAI scans the door every day. Tool changes go
live once its checks pass, with no new listing version and no publish step.
A change it flags is held, and that tool keeps its last approved definition.
So the server has to stay compatible with the approved schemas until the
held update is live.

**After every hosted MCP release:**

1. Run `pnpm preflight`. A failure here is a change the scan would hold.
2. In the management page, open **MCPs**, then the server, then **Issues**,
   and select **Rescan**. Waiting for the daily scan also works.
3. Read the result. A held tool shows its **Held update** beside its **Live
   definition**. Fix it on the server and rescan, or appeal.

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
4. Submit for review. Once approved, publish it.

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
- **The connection is `mixed`.** Under `oauth`, ChatGPT links the account
  before the first call, whatever each tool declares, so nobody publishes
  without signing in. `mixed` lets a person publish straight away and connect
  only when they ask for something an account holds. Preflight holds
  `.mcp.json` to the mode the door's tools imply.
- **The site password stays.** `deployments_upload` takes an optional
  `password` that locks the site it publishes. It's a setting for the
  user's own site, not their credential to another service, and the
  published listing says it.
- **`via` and `status` stay in results.** `via` tells people where a deploy
  came from in the console. `status` is the deploy's state. Neither is
  telemetry.
- **Developer Tools only, English only.**
- **One skill, publishing a site.** The server's instructions say what an
  agent should do in a sentence; the skill is the workflow around
  `deployments_upload`: complete static files, one publish, the links and
  the password told back, a change published as a new site, a server-side
  request declined. It ships in the package rather than from the server,
  because OpenAI imports a server's skills as a snapshot at scan time and
  does not read them at runtime, so serving them adds machinery and no
  freshness. The estate's other `SKILL.md` teaches the `ship` CLI, which
  ChatGPT can't run, so it isn't one of these.
- **OpenAI's words.** This repo says plugin, Plugins Directory and MCP
  server URL, as OpenAI does. The repo name `gpt` and the `/gpt` door are
  ours.

## License

MIT
