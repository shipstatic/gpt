# ShipStatic for ChatGPT

ShipStatic as an app inside ChatGPT — ask, and your site is live.

> One URL. Your agent ships.
> Free, no install, no signup, no API key.

This repository hosts the public-facing artifacts for the ShipStatic ChatGPT
App: README, license, icon, screenshots, and submission materials. The app
itself is powered by [ShipStatic's hosted MCP server][mcp] — connected at
`https://mcp.shipstatic.com/gpt` — which exposes a single
`deployments_upload` tool and an inline result card. The bare
`https://mcp.shipstatic.com` URL is the same server for any other MCP
client (Claude, Cursor, n8n, …); the `/gpt` suffix only changes the
analytics tag on the resulting deploy.

The previous Custom GPT (GPT Actions + OpenAPI) is preserved on the
[`old` branch](https://github.com/shipstatic/gpt/tree/old) for reference.
This `main` branch tracks the Apps SDK successor.

## What it does

Ask ChatGPT to build any static site — a portfolio, a landing page, a
résumé, a coming-soon page — and the ShipStatic app deploys it instantly.
You get back a live `*.shipstatic.com` URL and a claim link to keep the
site permanently if you want.

- **Anonymous by default.** No account, no API key. Public deploys expire
  in 3 days unless claimed.
- **Inline result card.** Live URL, screenshot, claim link, and a copy
  button rendered directly in the chat.
- **Password protection.** Ask for a password and the deployment is gated
  behind an unlock prompt — on the deploy URL and on any custom domains
  pointing at it.

## How to add it

*Listing in OpenAI's app directory is pending submission.* When the app is
live, you'll be able to add it from the directory in ChatGPT in one click.

In the meantime, the same flow works in any MCP-capable client today —
including [ChatGPT's developer mode connectors][devmode]:

| Client | Setup |
|---|---|
| ChatGPT (developer mode connectors) | Add an MCP server pointing at `https://mcp.shipstatic.com` |
| Claude Desktop / Claude.ai | Add a custom connector with the same URL |
| Claude Code | `claude mcp add --transport http shipstatic https://mcp.shipstatic.com` |
| Cursor, Antigravity, Windsurf, n8n, anywhere with `mcp.json` | `{ "mcpServers": { "shipstatic": { "url": "https://mcp.shipstatic.com" } } }` |

## What lives where

| Concern | Location |
|---|---|
| MCP server (protocol, widget resource, defensive caps) | [`shipstatic/monorepo` — `cloudflare/mcp/`][mcp] *(private)* |
| Inline deploy-card widget (HTML/CSS/JS) | [`shipstatic/monorepo` — `cloudflare/mcp/src/widget.ts`][mcp] *(private)* |
| Public stdio MCP for power users (15 tools, account-tied) | [`@shipstatic/mcp`][stdio] *(npm + MCP Registry)* |
| App directory listing artifacts (this repo) | README, LICENSE, icon, screenshots |
| Privacy policy | <https://shipstatic.com/privacy/> |
| Terms of service | <https://shipstatic.com/terms/> |
| Platform rules + abuse reporting | <https://shipstatic.com/rules/> |
| Previous Custom GPT (GPT Actions) | [`old` branch](https://github.com/shipstatic/gpt/tree/old) |

## Trust & safety

Anonymous public deployments are governed by ShipStatic's
[Platform Rules](https://shipstatic.com/rules/) and actively moderated:

- **Automated AI moderation** reviews deployments against the platform
  policy (no malware, phishing, brand impersonation, hate speech, sexual
  content, or illegal content).
- **Manual review** on flagged or reported deployments.
- **Fast takedown.** Violating deployments are removed; repeat abusers
  blocked at IP and account level.
- **Limited exposure window.** Unclaimed deploys expire after 3 days,
  capping how long any abuse that slips past automated moderation stays
  live.

Report abuse to **abuse@shipstatic.com**.

## Also available

| Integration | Install |
|---|---|
| **[CLI & SDK](https://github.com/shipstatic/ship)** | `npm install -g @shipstatic/ship` |
| **[MCP Server](https://github.com/shipstatic/mcp)** | `npx @shipstatic/mcp` |
| **[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=shipstatic.shipstatic)** | Search "ShipStatic" in the VS Code Marketplace |
| **[GitHub Action](https://github.com/shipstatic/action)** | `shipstatic/action@v1` |
| **[Gemini Plugin](https://github.com/shipstatic/plugin)** | `gemini extensions install https://github.com/shipstatic/plugin` |
| **[n8n Node](https://github.com/shipstatic/n8n)** | Install `n8n-nodes-shipstatic` from n8n's Community Nodes |

## License

[MIT](./LICENSE).

[mcp]: https://mcp.shipstatic.com
[stdio]: https://www.npmjs.com/package/@shipstatic/mcp
[devmode]: https://platform.openai.com/docs/guides/developer-mode
