#!/usr/bin/env node
// Preflight: every check that can be automated against the live door and the
// package. Run before opening the portal, and on a schedule
// (`.github/workflows/ci.yml`), because the tools OpenAI scans live in
// another repo and its scan runs daily: a change there that the scan would
// hold is found here first. Must be all-green; any red is a blocker.
//
//   pnpm preflight                          # checks against prod
//   PREFLIGHT_MCP=... pnpm preflight        # override the MCP endpoint
//   PREFLIGHT_SITE=... pnpm preflight       # override the marketing site
//
// Exits non-zero on any failure, which is what the scheduled run reports.

import { readFile } from 'node:fs/promises';
import { buildPlugin, MCP_FILE, pinned, PLUGIN_FILE, readPluginInputs, render, UNSET } from './lib/plugin.mjs';

const MCP = process.env.PREFLIGHT_MCP ?? process.env.PREFLIGHT_HOST ?? 'https://mcp.shipstatic.com';
const SITE = process.env.PREFLIGHT_SITE ?? 'https://shipstatic.com';
const EXPECTED_TOOL = 'deployments_upload';
const EXPECTED_WIDGET_URI = 'ui://widget/deploy-card.html';
// The App's origin is an IDENTITY fact: it names the App in OpenAI's
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
section(`[1/3] The live MCP server (${MCP})`);

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
{
  const { body } = await rpc('/gpt', 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'preflight', version: '1' },
  });
  const liveVersion = body?.result?.serverInfo?.version;
  body?.result?.serverInfo?.name === 'shipstatic' && typeof liveVersion === 'string'
    ? pass(`Server identifies as "shipstatic" v${liveVersion} (the server's own version; the package has its own)`)
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

  // _meta.ui.*: what makes the tool an App with a card
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
  // surfaced in the ShipStatic web app, not telemetry (docs/decisions.md).
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
// registry owns the values and this compares the live door to what the
// listing promises a reviewer. A red here means a change the scan would
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
    ? pass('Every tool carries the hints the listing promises (ten closed-world reads, four destructive, two idempotent removes)')
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

// ---------- 2. Listing URLs ----------
section(`[2/3] The listing's four URLs on ${SITE.replace(/^https?:\/\//, '')}`);

let inputs;
try {
  inputs = await readPluginInputs();
} catch (err) {
  fail('manifest.md / test-cases.json read', String(err.message));
}

if (inputs) {
  const site = (url) => (SITE === 'https://shipstatic.com' ? url : url.replace(/^https:\/\/(www\.)?shipstatic\.com/, SITE));
  for (const name of ['Company URL', 'Support URL', 'Privacy policy URL', 'Terms of service URL']) {
    let url;
    try {
      url = site(pinned(inputs.manifest, name));
    } catch (err) {
      fail(name, String(err.message));
      continue;
    }
    const res = await fetch(url, { redirect: 'follow' }).catch(() => null);
    res?.status === 200 ? pass(`${name} resolves (${res.url})`) : fail(name, `status=${res?.status ?? 'unreachable'} ${url}`);
  }
}

// ---------- 3. The package ----------
section('[3/3] The package is the current build of its owners');

if (inputs) {
  try {
    const built = buildPlugin(inputs, liveTools);
    const [plugin, mcp] = await Promise.all([
      readFile(PLUGIN_FILE, 'utf8').catch(() => null),
      readFile(MCP_FILE, 'utf8').catch(() => null),
    ]);
    plugin === render(built.plugin) && mcp === render(built.mcp)
      ? pass(`plugin.json and mcp.json are the current build (${built.plugin.name} ${built.plugin.version}: manifest, test cases, live catalogue)`)
      : fail('plugin.json / mcp.json', plugin === null || mcp === null ? 'missing; run pnpm package' : 'stale; run pnpm package and commit the result');

    const url = built.mcp.mcpServers[built.plugin.name]?.url;
    url === `${MCP}/gpt`
      ? pass(`mcp.json names the live door (${url})`)
      : fail('mcp.json MCP server URL', `${url} ≠ ${MCP}/gpt`);

    // Reachable is all a script can say about a recording. Whether it plays,
    // shows the eight cases, and shows the sign-in a reviewer will meet is
    // the checklist's, and a green here does not stand in for it.
    const recording = pinned(inputs.manifest, 'Demo recording URL');
    if (recording === UNSET) {
      fail('Demo recording URL', 'still TBD in manifest.md; required for MCP review');
    } else {
      const res = await fetch(recording, { redirect: 'follow' }).catch(() => null);
      res?.status === 200
        ? pass(`The demo recording URL answers 200 (${recording}); playback and content are checked by a person`)
        : fail('Demo recording URL', `status=${res?.status ?? 'unreachable'} ${recording}`);
    }
  } catch (err) {
    fail('package build', String(err.message));
  }
}

// ---------- Summary ----------
console.log();
if (failed > 0) {
  console.log(`\x1b[31m✗\x1b[0m ${failed} check(s) failed — fix these before submitting.`);
  console.log('  If any of them is an open product question, see docs/decisions.md.');
  process.exit(1);
} else {
  console.log('\x1b[32m✓\x1b[0m All checks passed. Our half is ready.');
  console.log('  Next: run \x1b[1mpnpm checklist\x1b[0m to see the human steps for the portal.');
}
