#!/usr/bin/env node
// Preflight: every check that can be automated against the live `/gpt` door
// and the published listing. OpenAI scans the door daily and takes tool
// changes live on its own, holding any it flags, and the door moves in
// another repo (`cloudflare/mcp`). So this runs after every hosted MCP
// release, before every upload, and weekly (`.github/workflows/ci.yml`): a
// change the scan would hold is found here first. Any red is a blocker.
//
//   pnpm preflight                          # checks against prod
//   PREFLIGHT_MCP=... pnpm preflight        # override the MCP endpoint
//   PREFLIGHT_SITE=... pnpm preflight       # override the marketing site
//
// Exits non-zero on any failure, which is what the scheduled run reports.

import { readFile } from 'node:fs/promises';

const MCP = process.env.PREFLIGHT_MCP ?? process.env.PREFLIGHT_HOST ?? 'https://mcp.shipstatic.com';
const SITE = process.env.PREFLIGHT_SITE ?? 'https://shipstatic.com';
// The listing as OpenAI holds it, in the Codex layout its release ZIP uses:
// the manifest, and the one MCP server it names.
const LISTING = new URL('../.codex-plugin/plugin.json', import.meta.url);
const SERVERS = new URL('../.mcp.json', import.meta.url);
const EXPECTED_TOOL = 'deployments_upload';
const EXPECTED_WIDGET_URI = 'ui://widget/deploy-card.html';
// The App origin is an IDENTITY fact: it names the plugin in OpenAI's
// directory, so the worker states it as production in every environment and
// this check does not follow a PREFLIGHT_SITE override.
const EXPECTED_APP_DOMAIN = 'https://shipstatic.com';
// The screenshot origin is an ENVIRONMENT fact: the card's tile shows the
// deployment's screenshot, so its CSP names the environment's own screenshot
// host, derived the way the worker derives it, so an override to the dev
// endpoint checks the dev CSP rather than failing on it.
const SCREENSHOTS_ORIGIN = `https://screenshots.${new URL(MCP).hostname.split('.').slice(1).join('.')}`;

let failed = 0;
const pass = (label) => console.log(`  \x1b[32m✓\x1b[0m ${label}`);
const fail = (label, detail) => {
  console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
  failed += 1;
};
const info = (label) => console.log(`  \x1b[33mℹ\x1b[0m ${label}`);
const section = (title) => console.log(`\n${title}`);

console.log('\n\x1b[1mShipStatic listing preflight\x1b[0m');
console.log("Checking that everything OpenAI's scan and review team will encounter is healthy.");

// ---------- 1. Live MCP server ----------
section(`[1/2] The live MCP server (${MCP})`);

async function rpc(path, method, params, id = 1) {
  const res = await fetch(`${MCP}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', method, id, ...(params ? { params } : {}) }),
  });
  const body = await res.json().catch(() => null);
  return { res, body };
}

{
  const res = await fetch(`${MCP}/health`);
  const body = await res.text();
  res.status === 200 && body === 'ok'
    ? pass('Health endpoint responds')
    : fail('Health endpoint', `status=${res.status} body=${JSON.stringify(body)}`);
}

let liveTools = [];
let liveVersion;
{
  const { body } = await rpc('/gpt', 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'preflight', version: '1' },
  });
  liveVersion = body?.result?.serverInfo?.version;
  body?.result?.serverInfo?.name === 'shipstatic' && typeof liveVersion === 'string'
    ? pass(`Server identifies as "shipstatic" v${liveVersion}`)
    : fail('Server identity', JSON.stringify(body).slice(0, 200));
}

{
  const { body } = await rpc('/gpt', 'tools/list');
  const tools = body?.result?.tools ?? [];
  liveTools = tools;
  const tool = tools.find((t) => t.name === EXPECTED_TOOL);
  tool
    ? pass(`Exposes the ${EXPECTED_TOOL} tool`)
    : fail('Tool exposure', `expected ${EXPECTED_TOOL}; got ${tools.map((t) => t.name).join(', ')}`);

  // _meta.ui.*: what gives the tool its card
  const meta = tool?._meta ?? {};
  meta.ui?.resourceUri === EXPECTED_WIDGET_URI
    ? pass(`  Widget URI points at ${EXPECTED_WIDGET_URI}`)
    : fail('  Widget URI (_meta.ui.resourceUri)', JSON.stringify(meta.ui));

  Array.isArray(meta.ui?.visibility) && meta.ui.visibility.includes('model')
    ? pass('  Tool is model-invoked (visibility includes "model")')
    : fail('  Tool visibility', JSON.stringify(meta.ui?.visibility));

  // outputSchema fields the card renders
  const out = tool?.outputSchema?.properties ?? {};
  const expected = ['url', 'claim', 'expires', 'files', 'size', 'password'];
  const missing = expected.filter((k) => !(k in out));
  missing.length === 0
    ? pass('  Output schema includes every field the widget renders')
    : fail('  Output schema missing fields', missing.join(','));

  // via + status are functional metadata (creation method, deploy state)
  // surfaced in the ShipStatic web app, not telemetry (README.md, "Decisions").
  const extras = ['via', 'status'].filter((k) => k in out);
  extras.length === 2
    ? pass('  Output schema includes via + status (creation method + deploy state; functional, not telemetry)')
    : fail('  Output schema missing via or status', 'these are user-visible metadata fields');
}

{
  const { body } = await rpc('/gpt', 'resources/read', { uri: EXPECTED_WIDGET_URI });
  const c = body?.result?.contents?.[0];
  c?.mimeType === 'text/html;profile=mcp-app' && typeof c.text === 'string'
    ? pass('Widget HTML serves with the right MIME type')
    : fail('Widget HTML', JSON.stringify(c)?.slice(0, 200));

  // Widget _meta fields the scan checks. The App's origin rides ChatGPT's
  // own key, never the standard `ui.domain`: that key's format is each
  // host's, and Claude refuses to render the card over this value.
  const ui = c?._meta?.ui ?? {};
  c?._meta?.['openai/widgetDomain'] === EXPECTED_APP_DOMAIN
    ? pass(`  Widget declares its App origin (openai/widgetDomain: ${EXPECTED_APP_DOMAIN})`)
    : fail('  Widget App origin (_meta.openai/widgetDomain)', String(c?._meta?.['openai/widgetDomain']));
  !('domain' in ui)
    ? pass('  Widget leaves the standard ui.domain to each host')
    : fail('  Widget carries _meta.ui.domain, which Claude refuses', String(ui.domain));
  ui.prefersBorder === true
    ? pass('  Widget asks the host to draw the card frame (prefersBorder: true)')
    : fail('  Widget prefersBorder', String(ui.prefersBorder));
  JSON.stringify(ui.csp) ===
    JSON.stringify({ connectDomains: [], resourceDomains: [SCREENSHOTS_ORIGIN], frameDomains: [] })
    ? pass(`  Widget CSP loads the platform's own screenshots (${SCREENSHOTS_ORIGIN}) and allows nothing else`)
    : fail('  Widget CSP (_meta.ui.csp)', JSON.stringify(ui.csp));
  typeof c?._meta?.['openai/widgetDescription'] === 'string'
    ? pass('  Widget description present (surfaced under the widget in ChatGPT)')
    : fail('  Widget description (_meta.openai/widgetDescription)', String(c?._meta?.['openai/widgetDescription']));
}

// The authentication posture, both halves. OpenAI's auth guide: "Triggering
// the tool-level OAuth flow requires both metadata (securitySchemes and the
// resource metadata document) and runtime errors that carry
// _meta["mcp/www_authenticate"]. Without both halves ChatGPT will not show
// the linking UI for that tool." The scan reads the first half off the
// door, so a door without it publishes fifteen anonymous tools.
{
  const schemes = (t) => (t.securitySchemes ?? []).map((s) => s.type).join('+');
  const upload = liveTools.find((t) => t.name === EXPECTED_TOOL);
  schemes(upload) === 'noauth+oauth2'
    ? pass(`${EXPECTED_TOOL} declares noauth + oauth2 (works without an account, more with one)`)
    : fail(`${EXPECTED_TOOL} securitySchemes`, schemes(upload) || 'absent');
  const rest = liveTools.filter((t) => t.name !== EXPECTED_TOOL);
  rest.length > 0 && rest.every((t) => schemes(t) === 'oauth2')
    ? pass(`  The other ${rest.length} tools declare oauth2 (an account is needed)`)
    : fail('  Account tools securitySchemes', JSON.stringify(rest.map((t) => [t.name, schemes(t)])));

  const { res, body: refusal } = await rpc('/gpt', 'tools/call', { name: 'whoami', arguments: {} }, 5);
  const carried = refusal?.result?._meta?.['mcp/www_authenticate'];
  res.status === 200 && refusal?.result?.isError === true && Array.isArray(carried) && carried.length === 1
    ? pass('An account tool called without a credential answers an error result carrying mcp/www_authenticate')
    : fail('Credential refusal on /gpt', `status=${res.status} body=${JSON.stringify(refusal).slice(0, 200)}`);
  const value = carried?.[0] ?? '';
  /error="[^"]+"/.test(value) && /error_description="[^"]+"/.test(value)
    ? pass('  The challenge names an error and an error_description (both required by OpenAI)')
    : fail('  Challenge shape', value);
  value.includes(`resource_metadata="${MCP}/.well-known/oauth-protected-resource/gpt"`)
    ? pass("  The challenge points at /gpt's own protected-resource document")
    : fail('  Challenge resource_metadata', value);

  // A presented credential the platform refuses must answer the same
  // challenge, never an internal error: a host retries a 500 and
  // re-authorizes on invalid_token.
  const malformed = await fetch(`${MCP}/gpt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: 'Bearer oauth-preflight',
    },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', id: 6, params: { name: 'whoami', arguments: {} } }),
  });
  const malformedBody = await malformed.json().catch(() => null);
  const malformedChallenge = malformedBody?.result?._meta?.['mcp/www_authenticate']?.[0] ?? '';
  malformed.status === 200 && malformedChallenge.includes('error="invalid_token"')
    ? pass('A malformed credential answers invalid_token in the result, not an internal error')
    : fail('Malformed credential on /gpt', `status=${malformed.status} body=${JSON.stringify(malformedBody).slice(0, 200)}`);

  const doc = await fetch(`${MCP}/.well-known/oauth-protected-resource/gpt`).then((r) => r.json()).catch(() => null);
  const issuer = doc?.authorization_servers?.[0];
  const as = issuer
    ? await fetch(`${issuer}/.well-known/oauth-authorization-server`).then((r) => r.json()).catch(() => null)
    : null;
  issuer && as?.issuer === issuer
    ? pass(`  The resource document names the authorization server's issuer exactly (${issuer})`)
    : fail('  Resource document / issuer', `authorization_servers[0]=${issuer} issuer=${as?.issuer}`);
}

// What the daily scan evaluates on every tool. Restated here as a literal
// table because this repo imports nothing from the server; the server's
// registry owns the values and this compares the live door to what review
// approved. A red here means a change the scan would
// HOLD against the last approved definition, found before the scan does.
{
  const read = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
  const remove = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true };
  const expected = {
    deployments_upload: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    deployments_list: read,
    deployments_get: read,
    deployments_set: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    deployments_delete: remove,
    domains_set: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    domains_list: read,
    domains_get: read,
    domains_records: read,
    domains_dns: read,
    domains_share: read,
    domains_validate: read,
    domains_verify: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    domains_delete: remove,
    whoami: read,
  };
  const hints = (t) => {
    const { title, ...rest } = t.annotations ?? {};
    return JSON.stringify(rest, Object.keys(rest).sort());
  };
  const wrong = liveTools.filter(
    (t) => hints(t) !== JSON.stringify(expected[t.name] ?? {}, Object.keys(expected[t.name] ?? {}).sort()),
  );
  wrong.length === 0 && liveTools.length === Object.keys(expected).length
    ? pass('Every tool carries the hints review approved (ten closed-world reads, four destructive, two idempotent removes)')
    : fail('Tool hints', wrong.map((t) => `${t.name}=${hints(t)}`).join(' ') || `expected ${Object.keys(expected).length} tools, live ${liveTools.length}`);

  const bareSchema = liveTools
    .filter((t) => {
      const props = t.outputSchema?.properties ?? {};
      return Object.keys(props).length === 0 || Object.values(props).some((p) => !p.description?.trim());
    })
    .map((t) => t.name);
  bareSchema.length === 0
    ? pass('Every tool publishes an outputSchema with every field described')
    : fail('Output schemas', bareSchema.join(', '));

  // A description describes the tool; the guidelines reject one that tells
  // the model how to behave. The same phrase set the server's own suites
  // sweep with.
  const INSTRUCTS = /you must|always show|share the link|to the user|with the user/i;
  const instructing = liveTools.filter((t) => INSTRUCTS.test(t.description ?? '')).map((t) => t.name);
  instructing.length === 0
    ? pass('No tool description instructs the model')
    : fail('Instructing descriptions', instructing.join(', '));
}

// ---------- 2. The published listing ----------
section(`[2/2] The published listing (${LISTING.pathname.split('/').slice(-2).join('/')})`);

let listing;
try {
  listing = JSON.parse(await readFile(LISTING, 'utf8'));
  pass(`The listing reads (${listing.interface.displayName} ${listing.version})`);
} catch (err) {
  fail('The listing', String(err.message));
}

if (listing) {
  // The listing's version is the MCP version it was published with. Tools
  // reach ChatGPT through the daily scan without a new listing version, so a
  // door ahead of the listing is the normal state between metadata uploads.
  listing.version === liveVersion
    ? pass(`The listing's version is the door's (${liveVersion})`)
    : info(`The listing shows ${listing.version}, the door runs ${liveVersion}: tools follow through the daily scan, the version moves with the next listing upload`);

  // The connection's mode must be the one the door's own tools declare. A
  // `noauth` tool beside `oauth2` ones is the hybrid: publishing works with no
  // account, everything else asks for one, and only `mixed` lets ChatGPT start
  // without a sign-in. Under `oauth` it links the account before the first
  // call, whatever a tool declares.
  try {
    listing.mcpServers === './.mcp.json'
      ? pass('The listing names its MCP declaration (./.mcp.json)')
      : fail('The listing mcpServers', String(listing.mcpServers));
    const servers = Object.values(JSON.parse(await readFile(SERVERS, 'utf8')).mcpServers ?? {});
    const server = servers[0];
    servers.length === 1 && server.url === `${MCP}/gpt`
      ? pass(`.mcp.json declares one server, the live door (${server.url})`)
      : fail('.mcp.json server', JSON.stringify(servers.map((s) => s.url)));
    const declared = new Set(liveTools.flatMap((t) => (t.securitySchemes ?? []).map((s) => s.type)));
    const expected = declared.has('noauth') ? (declared.has('oauth2') ? 'mixed' : 'none') : 'oauth';
    const mode = server?.extensions?.['com.openai']?.auth?.type;
    mode === expected
      ? pass(`The connection is declared ${mode}, as the door's tools are (${[...declared].sort().join(' + ')})`)
      : fail('Connection auth', `.mcp.json says ${mode}; the door's tools make it ${expected}`);
  } catch (err) {
    fail('.mcp.json', String(err.message));
  }

  const site = (url) => (SITE === 'https://shipstatic.com' ? url : url.replace(/^https:\/\/(www\.)?shipstatic\.com/, SITE));
  const urls = {
    'Website URL': listing.interface.websiteURL,
    'Support URL': listing.interface.supportURL,
    'Privacy policy URL': listing.interface.privacyPolicyURL,
    'Terms of service URL': listing.interface.termsOfServiceURL,
  };
  for (const [name, value] of Object.entries(urls)) {
    if (typeof value !== 'string') {
      fail(name, 'absent from the listing');
      continue;
    }
    const res = await fetch(site(value), { redirect: 'follow' }).catch(() => null);
    res?.status === 200 ? pass(`${name} resolves (${res.url})`) : fail(name, `status=${res?.status ?? 'unreachable'} ${value}`);
  }
}

// ---------- Summary ----------
console.log();
if (failed > 0) {
  console.log(`\x1b[31m✗\x1b[0m ${failed} check(s) failed. Fix these before the next scan or upload.`);
  process.exit(1);
} else {
  console.log('\x1b[32m✓\x1b[0m All checks passed.');
}
