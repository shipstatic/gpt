#!/usr/bin/env node
// Human-action checklist for the listing. Run after `pnpm preflight`
// passes green. This prints the steps that cannot be automated: every
// item the human handles before, during, and after clicking Submit in
// OpenAI's plugin portal.
//
// It restates NO copy. The listing is the ZIP `pnpm package` builds, so the
// portal has almost nothing to paste; the two values printed here (the
// package version, the MCP server URL) are read from the manifest's pinned
// headers. The "Open decisions" block at the end is sourced from
// `docs/decisions.md` (the canonical "Pending decisions" list) so the two
// stay in lockstep.
//
//   pnpm checklist

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const decisionsPath = join(__dirname, '..', 'docs', 'decisions.md');
const manifestPath = join(__dirname, '..', 'manifest.md');

// The manifest's two pinned headers, read rather than restated. Preflight
// holds the URL to the live door and the version to the built package; this
// only shows them.
async function readManifestPins() {
  let manifest;
  try {
    manifest = await readFile(manifestPath, 'utf8');
  } catch {
    return { version: '(manifest.md unreadable)', url: '(manifest.md unreadable)' };
  }
  return {
    version: manifest.match(/^##\s+Version:\s+`([^`]+)`\s*$/m)?.[1] ?? '(no Version header)',
    url: manifest.match(/^##\s+MCP server URL:\s+`([^`]+)`\s*$/m)?.[1] ?? '(no MCP server URL header)',
  };
}

// Parse the "Pending decisions" section out of docs/decisions.md. Each
// pending item is a `- [ ] **<title>** — <detail>` line where <detail>
// may continue across indented lines. We accumulate continuation lines
// until the next bullet, empty line, or section break.
async function readPendingDecisions() {
  let body;
  try {
    body = await readFile(decisionsPath, 'utf8');
  } catch {
    return [{ title: '(decisions.md unreadable)', detail: '' }];
  }
  const pendingSection = body.split(/^##\s+Pending decisions/m)[1];
  if (!pendingSection) return [];

  const items = [];
  let current = null;
  for (const line of pendingSection.split('\n')) {
    const start = line.match(/^- \[ \] \*\*([^*]+)\*\*\s*[—-]?\s*(.*)$/);
    if (start) {
      if (current) items.push(current);
      current = { title: start[1].trim(), detail: start[2].trim() };
    } else if (current && /^\s{4,}\S/.test(line)) {
      // indented continuation of the current bullet
      current.detail = (current.detail + ' ' + line.trim()).trim();
    } else if (line.trim() === '' || /^[-#]/.test(line.trim())) {
      // empty line or next bullet/header closes the current item
      if (current) { items.push(current); current = null; }
    }
  }
  if (current) items.push(current);
  return items;
}

const pins = await readManifestPins();

const PHASES = [
  {
    when: 'Before opening the portal',
    why:  'These are the prerequisites OpenAI checks before it looks at the plugin. Any "no" here is a hard blocker.',
    items: [
      {
        title: 'Your OpenAI org is identity-verified',
        detail: 'Individual or Business, in https://platform.openai.com/settings/organization/general. The directory shows the name of the identity chosen at upload.',
      },
      {
        title: 'Your account can submit',
        detail: 'Organization owners can; other members need Apps Management Write on the org (organization roles).',
      },
      {
        title: 'pnpm preflight is all-green',
        detail: 'It holds the live door to what the scan checks, the four listing URLs, and plugin.json + mcp.json to their owners. Two of its checks are yours to close: the demo recording URL in manifest.md, and the reviewer sign-in proof below.',
      },
      {
        title: 'Prove the reviewer sign-in from a fresh device',
        detail: 'A clean browser profile with no Google session, through ChatGPT itself: run the whoami case, take the Connect ShipStatic prompt, Continue with Google as the reviewer account, and finish the case. Signing in to the dashboard proves less than the flow the reviewer walks. If Google asks for a code or a device approval, that is the question for OpenAI submission support before anything else is built (manifest.md, Authentication).',
      },
      {
        title: 'Record the walkthrough, then pin its URL',
        detail: 'A reviewer-accessible recording of the five positive and three negative cases in submission/test-cases.json, in order, on the reviewer account, on desktop and on mobile. Pin it as "## Demo recording URL" in manifest.md, run pnpm package, commit. Preflight checks that the URL answers; that it plays and shows what it should is yours.',
      },
      {
        title: 'Build the ZIP',
        detail: `pnpm package writes plugin.json and mcp.json (${pins.version}) and dist/shipstatic-plugin.zip. Commit the two JSON files; the ZIP is what you upload.`,
      },
    ],
  },
  {
    when: 'In the portal: upload and checks',
    why:  'https://platform.openai.com/plugins. The listing is the ZIP; the tools are scanned off the server. Nothing is pasted by hand except the reviewer credentials.',
    items: [
      { title: 'Upload the ZIP', detail: 'Plugins → Upload new or existing plugin → choose the verified developer identity → upload dist/shipstatic-plugin.zip. The existing listing (1.0.0, from the previous form) is the plugin to upload INTO; download its release ZIP first if the portal asks for the existing package.' },
      { title: 'Metadata & Skills: read the Issues', detail: 'Copy any finding, fix it in manifest.md or the test cases, pnpm package, upload again. The package fields are read-only in the portal by design.' },
      { title: 'MCPs: connect the server', detail: `Connect → MCP Server URL ${pins.url}, authentication as the door states it (sign-in optional on deployments_upload, required on the other fourteen). The URL cannot change later without support.` },
      { title: 'Complete the domain-verification challenge', detail: 'The portal shows a challenge URL on the MCP hostname or an eligible parent. The token from the first submission sits at https://www.shipstatic.com/.well-known/openai-apps-challenge, which is a SIBLING of mcp.shipstatic.com, not a parent; if the portal names mcp.shipstatic.com or shipstatic.com, the token needs a home there (the mcp worker, a var-held token) before the connection completes.' },
      { title: 'Wait for the tool scan, then READ it', detail: 'Fifteen tools. deployments_upload shows sign-in optional and the other fourteen sign-in required; the hints as preflight states them. If the scan disagrees with a green preflight, stop: the scan is what users get.' },
    ],
  },
  {
    when: 'In the portal: review details and submit',
    why:  'Review information imports from the ZIP; the credentials are entered by hand and stay outside the package.',
    items: [
      { title: 'Review details: enter the reviewer credentials', detail: 'The reviewer Google login and password (manifest.md, Authentication, and docs/submission-history.md for the account), with the sign-in instructions from the manifest. Never in the package: ZIP metadata refuses test_credentials.' },
      { title: 'Check the imported test cases and recording', detail: 'Five positive, three negative, the recording URL: all read-only here, all from the ZIP. A change means a new ZIP.' },
      { title: 'Submit for review', detail: 'Complete the policy attestations. Track under Review status; feedback arrives by email. One review at a time per plugin.' },
      { title: 'Record the submission', detail: `Flip the Prepared entry in docs/submission-history.md to Submitted (package ${pins.version}).` },
    ],
  },
  {
    when: 'After approval, and from then on',
    why:  'Publishing is your click. After it, the server is scanned daily and eligible tool changes go live on their own; the package moves only when a listing fact changes.',
    items: [
      {
        title: 'Publish, then record it',
        detail: 'Open the approved package version → Publish plugin. Append a Published entry to docs/submission-history.md.',
      },
      {
        title: 'Prove the connect flow once',
        detail: 'Remove and re-add the plugin in ChatGPT, call an account tool, sign in. Proof: a new oauthConsent row for the ChatGPT client, and OpenAI fetching the /gpt protected-resource document on a live tail.',
      },
      {
        title: 'After every hosted MCP release: Rescan, and read the held definitions',
        detail: 'MCPs → the server → Issues → Rescan (or wait for the daily scan). A held tool keeps its last approved definition until the finding is fixed or appealed; the server must stay compatible with the approved schemas until the update is live.',
      },
      {
        title: 'Keep the reviewer account alive',
        detail: 'Its fixtures and its password stay as they are for later reviews; rotate the password only if it leaks, and update Review details the same day.',
      },
    ],
  },
];

console.log('\n\x1b[1mShipStatic ChatGPT plugin: listing checklist\x1b[0m');
console.log(`Generated: ${new Date().toISOString()}`);
console.log('Walk this top-to-bottom. Each \x1b[2m☐\x1b[0m is a thing to do.\n');

for (const { when, why, items } of PHASES) {
  console.log(`\x1b[1m[${when}]\x1b[0m`);
  console.log(`\x1b[2m${why}\x1b[0m`);
  console.log();
  for (const item of items) {
    console.log(`  ☐ ${item.title}`);
    console.log(`    \x1b[2m${item.detail}\x1b[0m`);
  }
  console.log();
}

// "Open decisions" is pulled live from docs/decisions.md so the two stay
// in lockstep. Printed last so the submitter sees the flow first, then the
// items that might block them.
console.log('\x1b[1m[Open decisions: resolve any blocking ones before submitting]\x1b[0m');
console.log('\x1b[2mPulled live from docs/decisions.md. See that file for the full rationale.\x1b[0m');
console.log();
const pending = await readPendingDecisions();
if (pending.length === 0) {
  console.log('  (none: every pending item resolved)\n');
} else {
  for (const item of pending) {
    console.log(`  ☐ ${item.title}`);
    if (item.detail) console.log(`    \x1b[2m${item.detail}\x1b[0m`);
  }
  console.log();
}

console.log('Tip: \x1b[1mpnpm preflight\x1b[0m must be all-green before any of this matters.');
