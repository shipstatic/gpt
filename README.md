# ShipStatic ChatGPT plugin: submission orchestration

This repo prepares everything we need to submit ShipStatic to OpenAI's
Plugins Directory (OpenAI renamed Apps to plugins in 2026-09; the
directory is shared by ChatGPT and Codex). The actual submission happens
in OpenAI's plugin submission portal. This repo makes sure we walk in
with everything ready, and it keeps watch afterwards: a published plugin
is a snapshot of the live tool surface taken at scan time, so it goes
stale every time the hosted MCP releases.

## Quick start

If you've never opened this repo before:

```bash
pnpm preflight    # Verify our half is ready: must be all-green
pnpm submission   # Build chatgpt-app-submission.json, the file the portal imports
pnpm checklist    # See the human steps for the plugin submission portal
```

Then open `manifest.md` beside the portal. Every portal field maps to a
labelled section in `manifest.md`, and the App Info, tool hint and test
case fields are filled by importing `chatgpt-app-submission.json`.

## What lives where

| Path | Purpose |
|---|---|
| `manifest.md` | Every text field the portal asks for: plugin name, descriptions, category, localization, URLs, support contact, MCP server URL, version, tool surface, authentication posture, release notes. |
| `submission/` | The two inputs the import file needs that nothing else owns: `justifications.json` (one sentence per hint per tool, each bound to the hint value it justifies) and `test-cases.json` (five positive and three negative cases the review team runs against the live plugin: reproducible, not marketing). |
| `chatgpt-app-submission.json` | The portal's import file, BUILT by `pnpm submission` from the manifest's pinned headers, the live catalogue's hints and the two files above. Committed so the diff between submissions is the review record; preflight refuses a stale one. |
| `policy/` | Drafts for `shipstatic.com/privacy`, `/terms`, and our content-moderation stance. The live pages carry the anonymous-deploy disclosures since the first submission; the drafts stay as the record of what was added. |
| `assets/` | App icon (multiple sizes) + widget screenshots. `assets/in-context/` is where the human drops conversation-screenshots captured from ChatGPT dev mode. |
| `scripts/` | `preflight.mjs` runs every automated check against the live MCP and the policy URLs: the tool surface, both halves of the authentication posture, the manifest's pins, the import file's freshness, and how far the published snapshot is behind. `submission.mjs` builds the import file (`lib/submission.mjs` is the derivation both scripts share). `checklist.mjs` prints the human-only steps, reading the manifest's pins and the open decisions from `docs/decisions.md`. |
| `docs/` | `decisions.md` is the canonical record of choices made and open. `submission-history.md` logs each submission and each PUBLISH; its latest `Published` entry is what the directory serves, and preflight reads it. |
| `.github/workflows/ci.yml` | Preflight on every push and weekly on a schedule, against production. The clock that makes a stale snapshot loud without anyone remembering. |

## Why this shape

- **One product, and the hosted endpoint is the door.** Public-facing
  artifacts here lead with the hosted endpoint — no install, no signup, no
  API key — and present the `@shipstatic/mcp` npm package as the local
  alternative for a different need, never as a bigger feature set. Both
  carry the same fifteen tools. We don't mention the hosted MCP's
  implementation repo, just the user-facing surface.
- **Verify our half, don't automate theirs.** OpenAI's portal is
  interactive and changes faster than we can keep up with. Building
  automation around the portal would be brittle. Building automation
  around what we control (MCP health, the auth posture on the wire,
  policy URLs, manifest correctness) is durable.
- **`manifest.md` is the only place to edit portal copy.** Single
  source. No copy in scripts, no copy in this README. The checklist reads
  the manifest's pins and the decisions file; it restates nothing (it
  used to, and the restated version sat two releases stale).
- **The import file is built, never drafted.** OpenAI offers a Codex skill
  that drafts `chatgpt-app-submission.json` from the source tree. That would
  be a fourth copy of the tool hints kept in sync by review, so instead the
  file is derived from the owners above and fenced: the build refuses a
  justification that names a hint the live server no longer declares, and
  preflight refuses a committed file that is not the current build.

## When `pnpm preflight` runs

**Three moments, and the third is why this heading exists.**

1. **Before every submission**: the flow below opens with it.
2. **After every hosted MCP version flip**, which happens in the monorepo
   (`cloudflare/mcp/CLAUDE.md`, "Version bump workflow", step 6) rather
   than here. The manifest states a version and preflight compares it to
   what the live `/gpt` endpoint reports, so a release elsewhere makes
   this repo wrong without anyone touching it.
3. **On a schedule**, weekly and on every push (`.github/workflows/ci.yml`),
   against production. Moment 2 is a runbook step in another repo, and a
   runbook step is a check that runs when somebody remembers: it was
   missed on 2026-08-14 (manifest `0.6.0` against a live `1.2.0`) and
   again on 2026-09-12, when the directory turned out to be serving a
   `1.0.0` snapshot taken before the door had OAuth, so every "Connect" in
   ChatGPT failed for twelve days. **A check that only runs when someone
   is about to submit is a check that runs once.** The schedule is what
   makes the drift loud.

What preflight holds, beyond the manifest's pins: the tool surface and
widget metadata a reviewer sees, **both halves of the authentication
posture** OpenAI's scan imports (per-tool `securitySchemes`, and a
credential refusal answered as an error result carrying
`_meta["mcp/www_authenticate"]`), the resource document naming the
authorization server's issuer exactly, and the gap between the latest
`Published` entry in `docs/submission-history.md` and the live version
(a notice, never a failure: being behind is the reason to submit).

## Submission flow

1. **Run `pnpm preflight`.** All green = our half is ready. Any red
   blocks submission.
2. **Run `pnpm checklist`.** This prints the human steps grouped as
   *before opening the portal*, *in the portal*, and *after clicking
   Submit for Review*. Work through it top-to-bottom.
3. **Run `pnpm submission`** and commit the result if it changed. In the
   portal, import `chatgpt-app-submission.json` where the form offers it;
   paste the remaining fields from `manifest.md`. **Scan Tools, and read
   what it imported**: fifteen tools, sign-in optional on
   `deployments_upload` and required on the other fourteen.
4. **Click "Submit for Review"** in the portal.
5. **Record the Case ID** in `docs/submission-history.md`.
6. **After approval, publish from the portal**, and record a `Published`
   entry. Until it is recorded, preflight keeps reporting the previous
   snapshot as what the directory serves, which is the truth.

## Voice canon (verbatim phrases)

When editing `manifest.md` long-form copy, these phrases echo
unchanged from `integrations/mcp/CLAUDE.md`:

- "One URL. Your agent ships."
- "Drop `https://mcp.shipstatic.com` into any MCP client."
- "No install, no signup, no API key."
- "the same fifteen tools, reached the other way" — the local package's
  positioning, and the reasons for it are a NEED (a folder on your own
  machine, a token instead of a sign-in, a client without OAuth), never a
  capability.

A fourth anchor used to read "Install the @shipstatic/mcp package for the
full toolset". It died on 2026-08-13 when the hosted door gained OAuth and
the other fourteen tools, and it survived here until 2026-08-15 because
prose has no compiler. **An anchor phrase that states a CAPABILITY has a
shelf life; one that states a NEED does not.**

## Out of scope (handled elsewhere)

- Modifying the hosted MCP worker (`cloudflare/mcp/`). What the portal
  scans is decided there; this repo only checks it.
- Deploying the policy pages to `shipstatic.com`: that is `web/www/`
  engineering, separate from this repo.
- Stripping internal fields (`via`, `status`) from the Deployment
  response: resolved in `docs/decisions.md` (kept, they are functional).

---

*This repo orchestrates the ChatGPT plugin submission. The live MCP is
in production at `https://mcp.shipstatic.com` (`/gpt` for ChatGPT
traffic). Submission-ready when `pnpm preflight` is green, pending the
human-only items surfaced by `pnpm checklist`.*
