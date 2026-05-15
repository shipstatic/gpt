# ShipStatic ChatGPT App — Submission Orchestration

This repo prepares everything we need to submit ShipStatic to the
ChatGPT App directory. The actual submission happens on OpenAI's
dashboard at `https://platform.openai.com/apps-manage` — this repo
just makes sure we walk in with everything ready.

## Quick start

If you've never opened this repo before:

```bash
pnpm preflight    # Verify our half is ready — must be all-green
pnpm checklist    # See the human steps for the OpenAI dashboard
```

Then open `manifest.md` and `tests/prompts.md` side-by-side with the
dashboard. Every dashboard field maps to a labelled section in
`manifest.md`; the dashboard's "test prompts" field gets each block
from `tests/prompts.md`.

## What lives where

| Path | Purpose |
|---|---|
| `manifest.md` | Every text field the dashboard asks for — App name, descriptions, category, localization, URLs, support contact, connector URL, version, tool surface, OAuth status. |
| `tests/prompts.md` | Test prompts with expected responses. OpenAI's review team runs these against the live App — they're reproducible test cases, not marketing examples. |
| `policy/` | Drafts for `shipstatic.com/privacy`, `/terms`, and our content-moderation stance. The live pages exist; these drafts are proposed updates that add the anonymous-deploy disclosures. Publishing them happens in `web/www/` — separate engineering. |
| `assets/` | App icon (multiple sizes) + widget screenshots. `assets/in-context/` is where the human drops conversation-screenshots captured from ChatGPT dev mode. |
| `scripts/` | `preflight.mjs` runs every automated check against the live MCP and the policy URLs. `checklist.mjs` prints the human-only steps and pulls open decisions from `docs/decisions.md`. |
| `docs/` | `decisions.md` is the canonical record of choices made and open. `submission-history.md` logs each submission's Case ID and reviewer feedback. |

## Why this shape

- **One product, two doors in.** Public-facing artifacts here describe
  ShipStatic MCP as a single product with two ways to use it: the
  hosted endpoint (no install) and the `@shipstatic/mcp` npm package
  (full toolset). We don't mention the hosted MCP's implementation
  repo, just the user-facing surface.
- **Verify our half, don't automate theirs.** OpenAI's dashboard is
  interactive and changes faster than we can keep up with. Building
  automation around the dashboard would be brittle. Building
  automation around what we control — MCP health, policy URLs,
  manifest correctness — is durable.
- **`manifest.md` is the only place to edit dashboard copy.** Single
  source. No copy in scripts, no copy in this README. The two scripts
  read from `manifest.md` and `docs/decisions.md` to stay in sync.

## Submission flow

1. **Run `pnpm preflight`.** All green = our half is ready. Any red
   blocks submission.
2. **Run `pnpm checklist`.** This prints the human steps grouped as
   *before opening the dashboard*, *in the dashboard*, and *after
   clicking Submit*. Work through it top-to-bottom.
3. **Open `manifest.md` + `tests/prompts.md`** side-by-side with the
   dashboard. Paste each section into the matching dashboard field.
4. **Click "Submit for review"** in the dashboard.
5. **Record the Case ID** (from OpenAI's confirmation email) in
   `docs/submission-history.md`.

## Voice canon (verbatim phrases)

When editing `manifest.md` long-form copy, these phrases echo
unchanged from `integrations/mcp/CLAUDE.md`:

- "One URL. Your agent ships."
- "Drop `https://mcp.shipstatic.com` into any MCP client."
- "No install, no signup, no API key."
- "Install the @shipstatic/mcp package for the full toolset (custom
  domains, listing, account-tied ops)."

## Out of scope (handled elsewhere)

- Modifying the hosted MCP worker. The widget is final at v0.6.0.
- Deploying the policy pages to `shipstatic.com` — that's `web/www/`
  engineering, separate from this repo.
- Stripping internal fields (`via`, `status`) from the Deployment
  response — flagged in `docs/decisions.md` for the human; execution
  would happen on the API side, not here.

---

*This repo orchestrates the ChatGPT App submission. The live MCP is
in production at `https://mcp.shipstatic.com` (`/gpt` for ChatGPT
traffic). The widget is final at v0.6.0. Submission-ready pending the
human-only items surfaced by `pnpm checklist`.*
