#!/usr/bin/env node
// Pre-submission preflight — every check that can be automated against
// the live surface. Run before opening the OpenAI dashboard. Must be
// all-green; any red is a submission blocker.
//
//   pnpm preflight                          # checks against prod
//   PREFLIGHT_MCP=... pnpm preflight        # override the MCP endpoint
//   PREFLIGHT_SITE=... pnpm preflight       # override the marketing site
//
// Exits non-zero on any failure so this can gate a future CI workflow.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MCP = process.env.PREFLIGHT_MCP ?? process.env.PREFLIGHT_HOST ?? 'https://mcp.shipstatic.com';
const SITE = process.env.PREFLIGHT_SITE ?? 'https://shipstatic.com';
const EXPECTED_TOOL = 'deployments_upload';
const EXPECTED_WIDGET_URI = 'ui://widget/deploy-card.html';
const EXPECTED_APP_DOMAIN = SITE;
const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '..', 'manifest.md');

let failed = 0;
const pass = (label) => console.log(`  \x1b[32m✓\x1b[0m ${label}`);
const fail = (label, detail) => {
  console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
  failed += 1;
};
const section = (title) => console.log(`\n${title}`);

console.log('\n\x1b[1mShipStatic submission preflight\x1b[0m');
console.log('Checking that everything OpenAI\'s review team will encounter is healthy.');

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

let liveVersion = null;
{
  const { res, body } = await rpc('/gpt', 'initialize', {
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
  const { res, body } = await rpc('/gpt', 'tools/list');
  const tools = body?.result?.tools ?? [];
  const tool = tools.find(t => t.name === EXPECTED_TOOL);
  tool
    ? pass(`Exposes the ${EXPECTED_TOOL} tool`)
    : fail('Tool exposure', `expected ${EXPECTED_TOOL}; got ${tools.map(t => t.name).join(', ')}`);

  // Annotations the review team checks
  const a = tool?.annotations ?? {};
  a.readOnlyHint === false && a.destructiveHint === false && a.openWorldHint === true
    ? pass('  Tool annotations look right (readOnly=false, destructive=false, openWorld=true)')
    : fail('  Tool annotations', JSON.stringify(a));

  // _meta.ui.* — App-directory submission gates
  const meta = tool?._meta ?? {};
  meta.ui?.resourceUri === EXPECTED_WIDGET_URI
    ? pass(`  Widget URI points at ${EXPECTED_WIDGET_URI}`)
    : fail('  Widget URI (_meta.ui.resourceUri)', JSON.stringify(meta.ui));

  Array.isArray(meta.ui?.visibility) && meta.ui.visibility.includes('model')
    ? pass('  Tool is model-invoked (visibility includes "model")')
    : fail('  Tool visibility', JSON.stringify(meta.ui?.visibility));

  // outputSchema fields the widget renders
  const out = tool?.outputSchema?.properties ?? {};
  const expected = ['deployment', 'url', 'claim', 'screenshot', 'expires', 'files', 'size', 'password'];
  const missing = expected.filter(k => !(k in out));
  missing.length === 0
    ? pass('  Output schema includes every field the widget renders')
    : fail('  Output schema missing fields', missing.join(','));

  // Telemetry-leaning fields — flag them for the data-minimization decision.
  const flagged = ['via', 'status'].filter(k => k in out);
  if (flagged.length > 0) {
    console.log(`  \x1b[33m⚠\x1b[0m  Heads up: output schema still includes ${flagged.join(', ')} — open decision in docs/decisions.md`);
  }
}

{
  const { res, body } = await rpc('/gpt', 'resources/read', { uri: EXPECTED_WIDGET_URI });
  const c = body?.result?.contents?.[0];
  c?.mimeType === 'text/html;profile=mcp-app' && typeof c.text === 'string'
    ? pass('Widget HTML serves with the right MIME type')
    : fail('Widget HTML', JSON.stringify(c)?.slice(0, 200));

  // Widget _meta fields — submission gates per OpenAI Apps SDK
  const ui = c?._meta?.ui ?? {};
  ui.domain === EXPECTED_APP_DOMAIN
    ? pass(`  Widget declares its parent App domain (${EXPECTED_APP_DOMAIN})`)
    : fail('  Widget parent domain (_meta.ui.domain)', String(ui.domain));
  ui.prefersBorder === true
    ? pass('  Widget asks the host to draw the card frame (prefersBorder: true)')
    : fail('  Widget prefersBorder', String(ui.prefersBorder));
  ui.csp && Array.isArray(ui.csp.resourceDomains)
    && ui.csp.resourceDomains.includes('https://screenshots.shipstatic.com')
    ? pass('  Widget CSP whitelists the screenshot host')
    : fail('  Widget CSP (_meta.ui.csp)', JSON.stringify(ui.csp));

  // openai/widgetDescription — surfaced under the widget; reviewer-
  // visible. cloudflare/mcp/smoke.mjs checks this too; parity here.
  typeof c?._meta?.['openai/widgetDescription'] === 'string'
    ? pass('  Widget description present (surfaced under the widget in ChatGPT)')
    : fail('  Widget description (_meta.openai/widgetDescription)', String(c?._meta?.['openai/widgetDescription']));
}

// ---------- 2. Policy URLs ----------
section(`[2/3] Policy URLs on ${SITE.replace(/^https?:\/\//, '')}`);

const urls = [
  ['Company URL', `${SITE}`],
  ['Privacy policy URL', `${SITE}/privacy`],
  ['Terms of service URL', `${SITE}/terms`],
];

for (const [label, url] of urls) {
  const res = await fetch(url, { redirect: 'follow' });
  res.status === 200
    ? pass(`${label} resolves (${res.url})`)
    : fail(`${label}`, `status=${res.status}`);
}

// ---------- 3. Manifest cross-check ----------
section('[3/3] Manifest matches the live surface');

// The manifest pins the Connector URL and Version with markdown headers
// of the exact form "## Connector URL: `<url>`" and "## Version: `<ver>`".
// These regexes match exactly that shape — anything else (different header
// level, missing backticks, prose form) FAILS rather than advisory-warns,
// so the manifest can't silently drift out of sync with the live surface.

try {
  const manifest = await readFile(manifestPath, 'utf8');
  const urlMatch = manifest.match(/^##\s+Connector URL:\s+`([^`]+)`\s*$/m);
  const versionMatch = manifest.match(/^##\s+Version:\s+`([^`]+)`\s*$/m);

  urlMatch && urlMatch[1] === `${MCP}/gpt`
    ? pass(`Connector URL in manifest.md matches the live endpoint (${MCP}/gpt)`)
    : fail('Connector URL in manifest.md', urlMatch ? `${urlMatch[1]} ≠ ${MCP}/gpt` : 'header missing or malformed — expected "## Connector URL: `<url>`"');

  versionMatch && liveVersion && versionMatch[1] === liveVersion
    ? pass(`Version in manifest.md matches what the live server reports (${liveVersion})`)
    : fail('Version in manifest.md', versionMatch ? `${versionMatch[1]} ≠ live ${liveVersion}` : 'header missing or malformed — expected "## Version: `<x.y.z>`"');
} catch (err) {
  fail('manifest.md read', String(err.message));
}

// ---------- Summary ----------
console.log();
if (failed > 0) {
  console.log(`\x1b[31m✗\x1b[0m ${failed} check(s) failed — fix these before submitting.`);
  console.log('  If any of them is an open product question, see docs/decisions.md.');
  process.exit(1);
} else {
  console.log('\x1b[32m✓\x1b[0m All checks passed. Our half is ready.');
  console.log('  Next: run \x1b[1mpnpm checklist\x1b[0m to see the human steps for the OpenAI dashboard.');
}
