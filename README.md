# Ship GPT Action

GPT Action for [ShipStatic](https://shipstatic.com) — deploy static websites, landing pages, and prototypes instantly from a custom GPT in ChatGPT.

## Setup

Run your own private ShipStatic GPT (anonymous deploys, free, no account required). To publish the official one to the GPT Store instead, jump to [Publishing](#publishing-maintainers).

In the [GPT Builder](https://chatgpt.com/gpts/editor):

1. **Configure → Instructions** — paste the contents of [`system-prompt.md`](./system-prompt.md).
2. **Configure → Actions → Create new action** — paste the contents of [`gpt-action.yaml`](./gpt-action.yaml) into the schema field.
3. **Authentication** — leave as **None**. The GPT mints a short-lived deploy token via `createAgentToken` and passes it through the deploy body. **No API key required.**

Save the GPT and start a chat — ask it to build and deploy any static site.

## Deploy — Free, No Account Needed

Ask your GPT to deploy a site. **No API key, no signup, no configuration.**

Your site is live instantly on `*.shipstatic.com`.

Deployments without an API key are public and **expire in 3 days unless claimed**. The response includes a **claim URL** — the GPT always shows it so you can keep the site permanently and link it to a free account.

Want a private site? Ask your GPT to set a password when deploying — visitors will be prompted to unlock before viewing, on the deployment URL and on any custom domains pointing at it.

## All Operations — Free API Key

**Optional.** The GPT works fully without an API key — see above. If you'd like more (permanent deployments, listing past deploys, custom domain inspection), add a free API key from [my.shipstatic.com/api-key](https://my.shipstatic.com/api-key).

The official store-published GPT is anonymous-only. To deploy to your own account, run a private GPT with the key configured:

1. **Create a GPT** in [GPT Builder](https://chatgpt.com/gpts/editor).
2. **Configure → Instructions** — paste [`system-prompt.md`](./system-prompt.md).
3. **Configure → Actions → Create new action** — paste [`gpt-action.yaml`](./gpt-action.yaml).
4. **Authentication → API Key → Auth Type: Bearer** — paste your `ship-...` key. Save.

**Optional optimization for forkers:** to skip the unused `createAgentToken` round-trip on every deploy, delete the `createAgentToken` step (and the `token` field from the deploy body example) in [`system-prompt.md`](./system-prompt.md) before pasting. With an API key configured, ChatGPT auto-injects the header and the body `token` is ignored anyway — the prompt works either way, but skipping the mint saves one API call per deploy.

Deployments now land in your account, never expire, and don't include a `claim` URL. The GPT can also call:

| Operation | Description |
|-----------|-------------|
| `deploy` | Publish files and get a live URL — permanent, in your account, optionally password-protected |
| `listDeployments` | List your deployments with URLs, status, labels, and password-protection state |
| `getDomain` | Inspect a custom domain — linked deployment, verification status, labels |

Account, billing, and domain *management* itself stays in the web dashboard at [my.shipstatic.com](https://my.shipstatic.com/). The GPT Action surface is intentionally narrow — for full deployment, domain, and account management ask your GPT to use the [ShipStatic MCP server](https://github.com/shipstatic/mcp) instead, or any of the integrations below.

## Trust & Safety

Anonymous public deployments — the default path for this GPT — are governed by ShipStatic's [Platform Rules](https://shipstatic.com/rules/) and actively moderated:

- **Automated AI moderation** reviews deployments against the platform policy (no malware, phishing, brand impersonation, hate speech, sexual content, or illegal content).
- **Manual review** by the ShipStatic team on flagged or reported deployments.
- **Fast takedown.** Deployments that violate the policy are removed; repeat abusers are blocked at IP and account level.
- **Limited exposure window.** Unclaimed anonymous deployments expire after 3 days, capping how long any abuse that slips past automated moderation can stay live.

The system prompt also instructs the GPT to refuse phishing, brand impersonation, and other abuse patterns *before* deploying — ChatGPT's own content policy is the first line, ShipStatic's moderation is the second.

Report abuse to **abuse@shipstatic.com**. See the [Platform Rules](https://shipstatic.com/rules/) and [abuse reporting page](https://shipstatic.com/abuse/) for details.

## Also Available

| Integration | Install |
|-------------|---------|
| **[CLI & SDK](https://github.com/shipstatic/ship)** | `npm install -g @shipstatic/ship` |
| **[MCP Server](https://github.com/shipstatic/mcp)** | `npx @shipstatic/mcp` |
| **[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=shipstatic.shipstatic)** | Search "ShipStatic" in the VS Code Marketplace |
| **[GitHub Action](https://github.com/shipstatic/action)** | `shipstatic/action@v1` |
| **[Gemini Plugin](https://github.com/shipstatic/plugin)** | `gemini extensions install https://github.com/shipstatic/plugin` |
| **[n8n Node](https://github.com/shipstatic/n8n)** | Install `n8n-nodes-shipstatic` from n8n's Community Nodes |

## Publishing (Maintainers)

Reproducible flow to publish or update the official ShipStatic GPT.

### 1. Create or open the GPT

In the [GPT Builder](https://chatgpt.com/gpts/editor), open the existing **ShipStatic** GPT (Configure tab) — or click **Create a GPT** for a new one.

### 2. Paste the artifacts

- **Configure → Instructions** — replace contents with [`system-prompt.md`](./system-prompt.md).
- **Configure → Actions** — open the existing action (or **Create new action**) and replace the schema with [`gpt-action.yaml`](./gpt-action.yaml).
- **Authentication** — **None**. Do not set an API key here; the GPT mints its own ephemeral token via `createAgentToken` and passes it through the deploy body.

If editing an action that previously used **API Key** auth, switch it to **None** and clear the key — leftover keys are sent on every call and would mask the body-token path during testing.

### 3. Set capabilities and conversation starters

**Configure → Capabilities** — leave all toggles **off**:

- ❌ Web Browsing
- ❌ DALL-E Image Generation
- ❌ Code Interpreter & Data Analysis

The GPT only deploys what the user describes in chat. Web Browsing and Code Interpreter add nothing here. DALL-E is a trap: generated images are short-lived ChatGPT-hosted URLs that can't be embedded in static deploys without re-encoding to base64, so the GPT will produce broken `<img>` tags.

**Configure → Conversation starters** — add 4 prompts that showcase what the GPT does best:

- Build me a one-page portfolio
- Make a landing page for my product
- Create a coming-soon page with a countdown
- Build a personal résumé site

### 4. Test in the preview pane

In the right-hand chat preview, run something **different** from the conversation starters (so you exercise more code paths than just one — pick a deploy that has dynamic content):

> Build a coming-soon page for "Project Lighthouse" launching in 30 days — include a live countdown.

Expected — within ~10 seconds:

1. The GPT calls `createAgentToken` (collapse the action card to confirm).
2. It calls `deploy` with `token` in the body and `via: gpt`.
3. The reply shows **both** a deployment URL (`https://*.shipstatic.com`) and a **claim URL** (`https://my.shipstatic.com/claim/...`).
4. Visiting the deployment URL renders the site.

If any of those four don't happen, the spec or prompt is wrong — fix the source files in this repo and re-paste, don't tweak inside the GPT Builder. The artifacts in this repo are the source of truth.

Smoke checks worth running once before publishing:

- Ask for a change ("make the background dark") → confirm a fresh deploy + new URL each time (each iteration mints a new token).
- Ask the GPT to set a password → deploys with `password` field, deployment URL prompts for unlock.
- Force a 401 (e.g. wait more than 60 seconds between token mint and deploy) → GPT mints a fresh token and retries once.

### 5. Submit to the GPT Store

**Privacy Policy URL — required.** When the GPT Builder asks for it (at publish time, or in **Configure → Actions** via the gear icon next to the action), enter `https://shipstatic.com/privacy/`. **OpenAI's GPT Store review auto-rejects submissions without a Privacy Policy URL.**

In the GPT Builder header: **Save** → **Share** → **Anyone with the link** first to sanity-check the public URL, then **Publish to GPT Store**. Category: **Productivity**. Use the title **ShipStatic** and the marketing tagline.

The GPT Store listing description (a separate, character-limited field) should be the **first paragraph** of `info.description` from the spec — the spec's longer multi-paragraph version stays put so OpenAI's reviewer and the GPT planner have full context. OpenAI's review can reject for description mismatches between the listing and the spec, so paste-from-spec keeps them aligned.

## Known Constraints

- **`/tokens/agent` is rate-limited per source IP at 5 requests/hour.** ChatGPT's outbound egress is shared across all GPT users, so this limit will throttle quickly under public-launch volume — every ChatGPT user looks like the same IP to our API. Before public launch, the platform side needs an IP allowlist (or equivalent identity signal) for ChatGPT's egress ranges. Tracked separately; do not work around it inside the spec/prompt.
- **JSON deploy body is capped at 5 MB** (`DEPLOYMENT.MAX_JSON_BODY_SIZE`). Binary assets are base64-inflated ~33%, so the effective binary budget is ~3.7 MB. The system prompt nudges toward inline SVG / CSS gradients for that reason. Larger deploys must use multipart, which GPT Actions can't construct — so this is a hard ceiling for the GPT path.
- **Agent tokens are single-use and expire in 60 seconds.** A retried `deploy` after a successful first call will 401 — the GPT must mint a fresh token. The 401-retry rule in the system prompt covers this.
- **GPT Action calls have a 30-second hard timeout** (OpenAI's enforcement). Anonymous deploys typically take 2–5 seconds; binary-heavy deploys near the 5 MB cap can approach the timeout. On timeout, ChatGPT shows a generic error and the deploy may have actually succeeded server-side — a retry could create a duplicate.

## License

MIT
