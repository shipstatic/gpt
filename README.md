# ShipStatic ChatGPT plugin: the listing

This repo is ShipStatic's listing in OpenAI's Plugins Directory (shared by
ChatGPT and Codex), kept as its sources. OpenAI takes a plugin as a ZIP:
`plugin.json` (the manifest, with the listing text, the review cases and
the release notes under `extensions.com.openai`), `mcp.json` (the one MCP
server) and the images they name. Both JSON files are built here from
`manifest.md` and `submission/test-cases.json`, never written by hand, and
the tools themselves are not in the package at all: OpenAI scans the hosted
MCP server for them, daily once the plugin is published, and takes eligible
changes live on its own.

## Quick start

```bash
pnpm preflight    # The live door, the four listing URLs, the package: must be all-green
pnpm package      # Build plugin.json, mcp.json and dist/shipstatic-plugin.zip
pnpm checklist    # The human steps, before, in and after the portal
```

Then upload `dist/shipstatic-plugin.zip` at https://platform.openai.com/plugins
and walk the checklist. The reviewer credentials are the one thing typed into
the portal by hand; everything else arrives in the ZIP.

## What lives where

| Path | Purpose |
|---|---|
| `manifest.md` | Every listing fact, once: the package name and version, the plugin name, subtitle, long description, developer name, category, capabilities, default prompts, the four URLs, the MCP server URL, the authentication posture and the reviewer arrangement, the demo recording URL, the release notes. Pinned headers (`## Name: \`value\``) are read by the build; sections are its prose. |
| `submission/test-cases.json` | Five positive and three negative cases the review team runs against the live plugin on the reviewer account. Together the positives walk the product: an anonymous deploy, connecting the account, reading it, a domain read, a deploy the case deletes. |
| `plugin.json`, `mcp.json` | The package's two files, BUILT by `pnpm package` and committed so the diff between uploads is the review record; preflight refuses a stale one. |
| `dist/` | The ZIP, rebuilt on demand and not committed. |
| `assets/` | The icon in two sizes (the listing's `logo` and `composerIcon`) and the card screenshots. The directory no longer shows screenshots; `assets/in-context/` keeps the captures as review evidence. |
| `policy/` | Drafts for `shipstatic.com/privacy`, `/terms`, and the content-moderation stance. The live pages carry the anonymous-deploy disclosures since the first submission; the drafts stay as the record of what was added. |
| `scripts/` | `preflight.mjs` runs every automated check: the live door (the auth halves, the hints, the schemas, a malformed credential's answer), the four URLs, the package against its owners. `package.mjs` builds the package (`lib/plugin.mjs` is the derivation both share). `checklist.mjs` prints the human steps, reading the manifest's pins and the open decisions from `docs/decisions.md`. |
| `docs/` | `decisions.md` is the record of choices made and open. `submission-history.md` logs each upload, review outcome and publish. |
| `.github/workflows/ci.yml` | Preflight on every push and weekly, against production: the clock that finds a change the daily scan would hold before the scan does. |

## Why this shape

- **One product, and the hosted endpoint is the door.** The listing leads
  with the hosted endpoint (no install, no signup, no API key) and never
  mentions the hosted MCP's implementation, only its user-facing surface.
- **Verify our half, don't automate theirs.** OpenAI's portal is
  interactive and changes faster than we can keep up with. What we control
  (the door, the auth posture on the wire, the URLs, the package) is checked
  by machine; what they control is a checklist.
- **`manifest.md` is the only place a listing fact is written.** The
  package is derived from it and fenced to it, so there is no second copy of
  the text to keep aligned, and the portal's own fields are read-only for a
  packaged plugin by design.
- **Two clocks, kept apart.** The package moves when a listing fact changes,
  with a new version and a new ZIP. The tools move with the server in
  another repo, and OpenAI's daily scan carries them; a release there owes
  no upload here, only a rescan if the change should land today.

## When `pnpm preflight` runs

1. **Before every upload**: the checklist opens with it.
2. **After every hosted MCP release**, in the other repo's version-bump
   workflow (`cloudflare/mcp/CLAUDE.md`): the scan evaluates the tools'
   annotations, descriptions and schemas, and holds a flagged change against
   the last approved definition, so a change the scan would hold is a change
   preflight names first.
3. **On a schedule**, weekly and on every push (`.github/workflows/ci.yml`),
   against production, because a runbook step in another repo is a check that
   runs when somebody remembers.
