#!/usr/bin/env node
// Verify the OpenAI API key has the access needed for the ChatGPT
// App submission flow. Run from integrations/gpt/ with the key in
// the environment:
//
//   OPENAI_API_KEY=sk-... node scripts/check-openai-permissions.mjs
//
// IMPORTANT CAVEAT: per the OpenAI Apps SDK docs, App submission is
// dashboard-based (https://platform.openai.com/apps-manage), not
// API-based. The `api.apps.read` and `api.apps.write` permissions
// gate dashboard access, not a public REST endpoint. This script
// therefore verifies:
//
//   1. The key reaches OpenAI's API at all (valid + not revoked).
//   2. The key has organization-level read access (a proxy signal
//      that the key isn't a stripped-down user-token).
//   3. Probes a few likely-shaped Apps endpoints for diagnostic
//      info — but the definitive verification is still: can you
//      create an App draft in the dashboard?
//
// If this script comes back happy, proceed to Step 9 of the plan and
// try to create a draft. That's the canonical test.

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('\x1b[31m✗\x1b[0m OPENAI_API_KEY not set in environment');
  console.error('');
  console.error('  Get an API key from: https://platform.openai.com/api-keys');
  console.error('  Then run: OPENAI_API_KEY=sk-... node scripts/check-openai-permissions.mjs');
  process.exit(2);
}

const BASE = 'https://api.openai.com/v1';
const pass  = (label, detail) => console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
const fail  = (label, detail) => console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
const info  = (label, detail) => console.log(`  \x1b[33mℹ\x1b[0m ${label}${detail ? ' — ' + detail : ''}`);
const dim   = (text) => `\x1b[2m${text}\x1b[0m`;

async function probe(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${KEY}`, 'OpenAI-Beta': 'apps-v1' },
    });
    const text = await res.text().catch(() => '');
    return { status: res.status, body: text.slice(0, 300) };
  } catch (err) {
    return { status: 0, body: String(err?.message ?? err) };
  }
}

console.log('\n\x1b[1mOpenAI API permission check\x1b[0m');
console.log(dim(`Key fingerprint: ${KEY.slice(0, 8)}…${KEY.slice(-4)} (only first 8 + last 4 chars shown)`));

let blocking = 0;

// ----- 1. Key validity -----
console.log('\n[1/3] Key validity');
{
  const { status, body } = await probe('/models');
  if (status === 200) {
    pass('Key reaches the API (GET /v1/models → 200)');
  } else if (status === 401) {
    fail('Key rejected (401)', 'invalid, revoked, or wrong format');
    blocking += 1;
  } else if (status === 429) {
    info('Rate-limited (429) — key looks valid, just busy');
  } else {
    fail(`Unexpected status ${status}`, body.slice(0, 80));
    blocking += 1;
  }
}

// ----- 2. Organization access -----
console.log('\n[2/3] Organization access');
{
  // Multiple possible org-info endpoints depending on the API version.
  const tries = ['/organization', '/me'];
  let saw200 = false;
  for (const path of tries) {
    const { status } = await probe(path);
    if (status === 200) {
      pass(`Can read account info (GET /v1${path} → 200)`);
      saw200 = true;
      break;
    }
  }
  if (!saw200) {
    info('No org-info endpoint responded 200 — likely OK, but the key may be project-scoped only.');
    info('  ' + dim('Project-scoped keys typically work for App submission as long as the project is on Global residency.'));
  }
}

// ----- 3. Apps SDK probe -----
console.log('\n[3/3] Apps SDK endpoint probes');
console.log('  ' + dim('OpenAI\'s Apps submission is dashboard-based; these probes are diagnostic only.'));
{
  const probes = ['/apps', '/organization/apps', '/apps/drafts'];
  let anyAuth = false;
  let anyForbidden = false;
  for (const path of probes) {
    const { status } = await probe(path);
    if (status === 200) {
      pass(`GET /v1${path} → 200 (your key can read Apps data here)`);
      anyAuth = true;
    } else if (status === 401) {
      fail(`GET /v1${path} → 401 (auth issue)`);
    } else if (status === 403) {
      fail(`GET /v1${path} → 403 (your account lacks apps.read at this endpoint)`);
      anyForbidden = true;
    } else if (status === 404) {
      info(`GET /v1${path} → 404 (endpoint doesn't exist — that's expected; submission is dashboard-only)`);
    } else {
      info(`GET /v1${path} → ${status}`);
    }
  }
  console.log();
  if (anyAuth) {
    info('At least one Apps endpoint responded — your key has some App-level access.');
  } else if (anyForbidden) {
    fail('At least one Apps endpoint returned 403 — your role may be missing the apps.read/write permission.');
    info('  Fix: ask the org owner to grant the role at');
    info('  https://platform.openai.com/settings/organization/roles');
    blocking += 1;
  } else {
    info('No public Apps endpoints exposed via API (expected — submission flow is dashboard-only).');
  }
}

// ----- Summary -----
console.log();
if (blocking > 0) {
  console.log(`\x1b[31m✗\x1b[0m ${blocking} blocking issue(s) — resolve before submission.`);
  process.exit(1);
}
console.log('\x1b[32m✓\x1b[0m API key works.');
console.log('  ' + dim('Definitive test: open https://platform.openai.com/apps-manage and create a draft App.'));
console.log('  ' + dim('If the dashboard lets you create + save a draft, your apps.write permission is fine.'));
