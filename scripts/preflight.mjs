#!/usr/bin/env node
// Pre-submission preflight: every check that can be automated against
// the live surface. Run before opening the plugin submission portal, and
// on a schedule (`.github/workflows/ci.yml`), because a published plugin
// is a SNAPSHOT of the live catalogue and the live catalogue moves in
// another repo. Must be all-green; any red is a submission blocker.
//
//   pnpm preflight                          # checks against prod
//   PREFLIGHT_MCP=... pnpm preflight        # override the MCP endpoint
//   PREFLIGHT_SITE=... pnpm preflight       # override the marketing site
//
// Exits non-zero on any failure, which is what the scheduled run reports.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSubmission, readSubmissionInputs, renderSubmission, SUBMISSION_FILE } from './lib/submission.mjs';

const MCP = process.env.PREFLIGHT_MCP ?? process.env.PREFLIGHT_HOST ?? 'https://mcp.shipstatic.com';
const SITE = process.env.PREFLIGHT_SITE ?? 'https://shipstatic.com';
const EXPECTED_TOOL = 'deployments_upload';
const EXPECTED_WIDGET_URI = 'ui://widget/deploy-card.html';
const EXPECTED_APP_DOMAIN = SITE;
// The screenshot host is an ENVIRONMENT fact (the widget's CSP names the
// environment it runs in), derived the way the worker derives it, so an
// override to the dev endpoint checks the dev CSP rather than failing on it.
const SCREENSHOT_HOST = `https://screenshots.${new URL(MCP).hostname.split('.').slice(1).join('.')}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '..', 'manifest.md');
const historyPath = join(__dirname, '..', 'docs', 'submission-history.md');

let failed = 0;
const pass = (label) => console.log(`  \x1b[32m✓\x1b[0m ${label}`);
const fail = (label, detail) => {
  console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
  failed += 1;
};
const info = (label) => console.log(`  \x1b[33mℹ\x1b[0m ${label}`);
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
let liveTools = [];
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

  // via + status are functional metadata (creation method, deploy state)
  // surfaced in the ShipStatic web app — not telemetry. Resolved in
  // docs/decisions.md; we only verify they're present here.
  const extras = ['via', 'status'].filter(k => k in out);
  if (extras.length === 2) {
    pass('  Output schema includes via + status (creation method + deploy state — functional, not telemetry)');
  } else if (extras.length > 0) {
    info(`  Output schema includes ${extras.join(', ')} — expected both via and status`);
  } else {
    fail('  Output schema missing via or status', 'these are user-visible metadata fields');
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
    && ui.csp.resourceDomains.includes(SCREENSHOT_HOST)
    ? pass(`  Widget CSP whitelists the screenshot host (${SCREENSHOT_HOST})`)
    : fail('  Widget CSP (_meta.ui.csp)', JSON.stringify(ui.csp));

  // openai/widgetDescription — surfaced under the widget; reviewer-
  // visible. cloudflare/mcp/smoke.mjs checks this too; parity here.
  typeof c?._meta?.['openai/widgetDescription'] === 'string'
    ? pass('  Widget description present (surfaced under the widget in ChatGPT)')
    : fail('  Widget description (_meta.openai/widgetDescription)', String(c?._meta?.['openai/widgetDescription']));
}

// The authentication posture, both halves. OpenAI's auth guide: "Triggering
// the tool-level OAuth flow requires both metadata (securitySchemes and the
// resource metadata document) and runtime errors that carry
// _meta["mcp/www_authenticate"]. Without both halves ChatGPT will not show
// the linking UI for that tool." Scan Tools snapshots the first half, so a
// scan taken without it freezes fifteen anonymous tools into the published
// record: that is what the 1.0.0 record was, and why every Connect died
// inside ChatGPT for the whole 2026-08-30 to 09-12 wave.
{
  const { body } = await rpc('/gpt', 'tools/list', undefined, 4);
  const tools = body?.result?.tools ?? [];
  liveTools = tools;
  const schemes = (t) => (t.securitySchemes ?? []).map((s) => s.type).join('+');
  const upload = tools.find((t) => t.name === EXPECTED_TOOL);
  schemes(upload) === 'noauth+oauth2'
    ? pass(`${EXPECTED_TOOL} declares noauth + oauth2 (works without an account, more with one)`)
    : fail(`${EXPECTED_TOOL} securitySchemes`, schemes(upload) || 'absent');
  const rest = tools.filter((t) => t.name !== EXPECTED_TOOL);
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

  const doc = await fetch(`${MCP}/.well-known/oauth-protected-resource/gpt`).then((r) => r.json()).catch(() => null);
  const issuer = doc?.authorization_servers?.[0];
  const as = issuer
    ? await fetch(`${issuer}/.well-known/oauth-authorization-server`).then((r) => r.json()).catch(() => null)
    : null;
  issuer && as?.issuer === issuer
    ? pass(`  The resource document names the authorization server's issuer exactly (${issuer})`)
    : fail('  Resource document / issuer', `authorization_servers[0]=${issuer} issuer=${as?.issuer}`);
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

// The manifest pins the MCP server URL and Version with markdown headers
// of the exact form "## MCP server URL: `<url>`" and "## Version: `<ver>`".
// These regexes match exactly that shape — anything else (different header
// level, missing backticks, prose form) FAILS rather than advisory-warns,
// so the manifest can't silently drift out of sync with the live surface.

try {
  const manifest = await readFile(manifestPath, 'utf8');
  const urlMatch = manifest.match(/^##\s+MCP server URL:\s+`([^`]+)`\s*$/m);
  const versionMatch = manifest.match(/^##\s+Version:\s+`([^`]+)`\s*$/m);

  urlMatch && urlMatch[1] === `${MCP}/gpt`
    ? pass(`MCP server URL in manifest.md matches the live endpoint (${MCP}/gpt)`)
    : fail('MCP server URL in manifest.md', urlMatch ? `${urlMatch[1]} ≠ ${MCP}/gpt` : 'header missing or malformed, expected "## MCP server URL: `<url>`"');

  versionMatch && liveVersion && versionMatch[1] === liveVersion
    ? pass(`Version in manifest.md matches what the live server reports (${liveVersion})`)
    : fail('Version in manifest.md', versionMatch ? `${versionMatch[1]} ≠ live ${liveVersion}` : 'header missing or malformed — expected "## Version: `<x.y.z>`"');
} catch (err) {
  fail('manifest.md read', String(err.message));
}

// The portal's import file is DERIVED (scripts/lib/submission.mjs) and
// committed, so the diff between submissions is the review record. A
// committed file that is not the current build would hand the portal a
// stale restatement of the hints or the copy, which is the drift the
// derivation exists to end. The build itself refuses a justification that
// names a hint the live server no longer declares.
try {
  const fresh = renderSubmission(buildSubmission(await readSubmissionInputs(), liveTools));
  const committed = await readFile(SUBMISSION_FILE, 'utf8').catch(() => null);
  committed === fresh
    ? pass('chatgpt-app-submission.json is the current build (manifest, live hints, justifications, test cases)')
    : fail('chatgpt-app-submission.json', committed === null ? 'missing; run pnpm submission' : 'stale; run pnpm submission and commit the result');
} catch (err) {
  fail('chatgpt-app-submission.json build', String(err.message));
}

// What OpenAI HOLDS, against what is live. A published plugin is a snapshot
// taken at scan time, so the directory serves whatever version was last
// published, whatever the server says today. This is a notice rather than a
// failure: being behind is the REASON to submit, and the pre-submission run
// must be able to go green while it is still true. The scheduled run's red is
// the manifest check above, which fires on every version flip.
try {
  const history = await readFile(historyPath, 'utf8');
  const published = [...history.matchAll(/^##\s+.*—\s+v(\S+)\s+—\s+Published\s*$/gm)].at(-1)?.[1];
  if (!published) {
    fail('Published version in docs/submission-history.md', 'no "## <date> — vX.Y.Z — Published" entry; record what the directory serves');
  } else if (published === liveVersion) {
    pass(`The published plugin (${published}) is the live version`);
  } else {
    info(`The directory serves ${published}; live is ${liveVersion}. Users get the ${published} snapshot until a new version is scanned, submitted and published.`);
  }
} catch (err) {
  fail('docs/submission-history.md read', String(err.message));
}

// ---------- Summary ----------
console.log();
if (failed > 0) {
  console.log(`\x1b[31m✗\x1b[0m ${failed} check(s) failed — fix these before submitting.`);
  console.log('  If any of them is an open product question, see docs/decisions.md.');
  process.exit(1);
} else {
  console.log('\x1b[32m✓\x1b[0m All checks passed. Our half is ready.');
  console.log('  Next: run \x1b[1mpnpm checklist\x1b[0m to see the human steps for the plugin submission portal.');
}
