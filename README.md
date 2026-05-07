# Ship GPT Action

GPT Action for [ShipStatic](https://shipstatic.com) — deploy static websites, landing pages, and prototypes instantly from a custom GPT in ChatGPT.

## Setup

In the [GPT Builder](https://chatgpt.com/gpts/editor):

1. **Configure → Instructions** — paste the contents of [`system-prompt.md`](./system-prompt.md).
2. **Configure → Actions → Create new action** — paste the contents of [`gpt-action.yaml`](./gpt-action.yaml) into the schema field.
3. **Authentication** — leave as **None**. The GPT calls `createAgentToken` first and uses the returned bearer on the next `deploy` call. No API key required.

Save the GPT and start a chat — ask it to build and deploy any static site.

## Deploy — Free, No Account Needed

Ask your GPT to deploy a site. No API key, no sign-up, no configuration.

Your site is live instantly on `*.shipstatic.com`.

Deployments without an API key are public and expire in 3 days. The response includes a **claim URL** — the system prompt instructs the GPT to always show it so users can keep the site permanently.

Want a private site? Ask your GPT to set a password when deploying — visitors will be prompted to unlock before viewing, on the deployment URL and on any custom domains pointing at it.

## All Operations — Free API Key

For permanent deployments and full control over your sites and domains, get a free API key from [my.shipstatic.com/api-key](https://my.shipstatic.com/api-key) and paste it into **Configure → Actions → Authentication → API Key (Bearer)**.

With an API key the GPT skips `createAgentToken` and gets access to the optional read operations.

| Operation | Description |
|-----------|-------------|
| `deploy` | Publish files and get a live URL instantly, optionally protected by a password |
| `listDeployments` | List all deployments with their URLs, status, labels, and password protection state |
| `getDomain` | Get domain details including linked deployment, verification status, and labels |

The GPT Action surface is intentionally narrow — for full deployment, domain, and account management ask your GPT to use the [ShipStatic MCP server](https://github.com/shipstatic/mcp) instead, or any of the integrations below.

## Also Available

| Integration | Install |
|-------------|---------|
| **[CLI & SDK](https://github.com/shipstatic/ship)** | `npm install -g @shipstatic/ship` |
| **[MCP Server](https://github.com/shipstatic/mcp)** | `npx @shipstatic/mcp` |
| **[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=shipstatic.shipstatic)** | Search "ShipStatic" in the VS Code Marketplace |
| **[GitHub Action](https://github.com/shipstatic/action)** | `shipstatic/action@v1` |
| **[Gemini Plugin](https://github.com/shipstatic/plugin)** | `gemini extensions install https://github.com/shipstatic/plugin` |

## License

MIT
