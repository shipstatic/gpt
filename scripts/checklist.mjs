#!/usr/bin/env node
// Human-action checklist for submission. Run after `pnpm preflight`
// passes green. This prints the steps that cannot be automated — every
// item the human handles before, during, and after clicking Submit on
// the OpenAI dashboard.
//
// The "Open decisions" block at the end is sourced from
// `docs/decisions.md` (the canonical "Pending decisions" list) so the
// two stay in lockstep.
//
//   pnpm checklist

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const decisionsPath = join(__dirname, '..', 'docs', 'decisions.md');

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

const PHASES = [
  {
    when: 'Before opening the dashboard',
    why:  'These are the prerequisites OpenAI checks before they look at the App. Any \"no\" here is a hard blocker.',
    items: [
      {
        title: 'Your OpenAI org is identity-verified',
        detail: 'Either Individual or Business, set in https://platform.openai.com. Unverified orgs are auto-rejected.',
      },
      {
        title: 'Your OpenAI project is on Global data residency, not EU',
        detail: 'EU residency projects cannot submit. If yours is EU, create or switch to a Global project before continuing.',
      },
      {
        title: 'Your account can create App drafts',
        detail: 'You need the api.apps.write and api.apps.read permissions on the org (or be an org member with the equivalent role).',
      },
      {
        title: 'Generate widget screenshots',
        detail: 'From the monorepo root: `node temp/serve.mjs`, then open http://localhost:7777. Switch Theme between light and dark, screenshot the iframe at each, and save as assets/widget-light.png and assets/widget-dark.png.',
      },
      {
        title: 'Capture in-context ChatGPT screenshots',
        detail: 'Install the dev-mode App in ChatGPT (web and at least one of iOS or Android). Run a real deploy through it, screenshot the full conversation + rendered widget, and save to assets/in-context/ following the README there.',
      },
    ],
  },
  {
    when: 'In the OpenAI dashboard',
    why:  'Open https://platform.openai.com/apps-manage. For each item below, paste from the matching section in manifest.md or upload the matching asset.',
    items: [
      { title: 'App name', detail: 'manifest.md → §App name (currently: ShipStatic)' },
      { title: 'Logo / icon', detail: 'Upload assets/icon-1024.png (the 1024×1024 master). assets/icon-480.png is for the MCP Registry, not this submission.' },
      { title: 'Short description', detail: 'manifest.md → §Short description' },
      { title: 'Long description', detail: 'manifest.md → §Long description' },
      { title: 'Category', detail: 'Developer Tools (manifest.md → §Category)' },
      { title: 'Localization', detail: 'en-US (manifest.md → §Localization). No translations at launch.' },
      { title: 'Company URL', detail: 'https://shipstatic.com' },
      { title: 'Privacy policy URL', detail: 'https://shipstatic.com/privacy (required by OpenAI)' },
      { title: 'Terms of service URL', detail: 'https://shipstatic.com/terms (provide if the dashboard requests it; not required by the submission spec we read)' },
      { title: 'Support contact', detail: 'support@shipstatic.com' },
      { title: 'MCP server URL', detail: 'https://mcp.shipstatic.com/gpt (the /gpt path tags deploys via:gpt for analytics)' },
      { title: 'OAuth credentials', detail: 'None — endpoint is anonymous by design.' },
      { title: 'Tool(s) exposed', detail: 'deployments_upload (single tool, by design)' },
      { title: 'Screenshots', detail: 'Upload assets/widget-light.png, assets/widget-dark.png, plus the in-context captures from assets/in-context/' },
      { title: 'Test prompts + expected responses', detail: 'tests/prompts.md — paste each prompt block. The review team runs these against the live App; they must reproducibly succeed.' },
    ],
  },
  {
    when: 'After clicking Submit',
    why:  'You\'ll get an email confirmation with a Case ID. Keep a record so future submissions can reference it.',
    items: [
      {
        title: 'Record the Case ID',
        detail: 'Append an entry to docs/submission-history.md with the Case ID, the date, the App version submitted (currently 0.6.0), and any notes.',
      },
      {
        title: 'Wait for review',
        detail: 'OpenAI doesn\'t publish a fixed timeline. They\'ll respond via the same email thread when there\'s an outcome (accept / changes requested / reject).',
      },
    ],
  },
];

console.log('\n\x1b[1mShipStatic ChatGPT App — submission checklist\x1b[0m');
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

// "Open decisions" — pulled live from docs/decisions.md so the two
// stay in lockstep. Print at the end so the submitter sees the flow
// first, then the items that might block them.
console.log('\x1b[1m[Open decisions — resolve any blocking ones before submitting]\x1b[0m');
console.log('\x1b[2mPulled live from docs/decisions.md. See that file for the full rationale.\x1b[0m');
console.log();
const pending = await readPendingDecisions();
if (pending.length === 0) {
  console.log('  (none — every pending item resolved) 🎉\n');
} else {
  for (const item of pending) {
    console.log(`  ☐ ${item.title}`);
    if (item.detail) console.log(`    \x1b[2m${item.detail}\x1b[0m`);
  }
  console.log();
}

console.log('Tip: \x1b[1mpnpm preflight\x1b[0m must be all-green before any of this matters.');
