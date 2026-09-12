#!/usr/bin/env node
// Human-action checklist for submission. Run after `pnpm preflight`
// passes green. This prints the steps that cannot be automated: every
// item the human handles before, during, and after clicking Submit in
// OpenAI's plugin submission portal.
//
// It restates NO copy. Every portal field points at the manifest section
// that owns it, and the two values it does print (the version, the MCP
// server URL) are read from the manifest's headers, the same headers
// preflight compares to the live server. The "Open decisions" block at the
// end is sourced from `docs/decisions.md` (the canonical "Pending decisions"
// list) so the two stay in lockstep.
//
//   pnpm checklist

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const decisionsPath = join(__dirname, '..', 'docs', 'decisions.md');
const manifestPath = join(__dirname, '..', 'manifest.md');

// The manifest's two pinned headers, read rather than restated. Preflight
// holds both to the live server; this only shows them.
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
    why:  'These are the prerequisites OpenAI checks before they look at the plugin. Any "no" here is a hard blocker.',
    items: [
      {
        title: 'Your OpenAI org is identity-verified',
        detail: 'Either Individual or Business, set in https://platform.openai.com. Unverified orgs are auto-rejected.',
      },
      {
        title: 'Your account has Apps Management: Write on the org',
        detail: 'OpenAI Platform roles settings. Without it the portal cannot create, edit or submit plugin drafts.',
      },
      {
        title: 'Screenshots are current',
        detail: 'assets/widget-light.png, assets/widget-dark.png, and the in-context captures in assets/in-context/. Re-shoot if the widget changed since the last submission.',
      },
    ],
  },
  {
    when: 'In the plugin submission portal',
    why:  'Open the plugin, or create one "With MCP". For each item below, paste from the matching section in manifest.md or upload the matching asset.',
    items: [
      { title: 'Plugin name', detail: 'manifest.md → §Plugin name' },
      { title: 'Logo', detail: 'Upload assets/icon-1024.png (the 1024×1024 master). assets/icon-480.png is for the MCP Registry, not this submission.' },
      { title: 'Short description', detail: 'manifest.md → §Short description' },
      { title: 'Long description', detail: 'manifest.md → §Long description' },
      { title: 'Category', detail: 'manifest.md → §Category' },
      { title: 'Localization', detail: 'manifest.md → §Localization' },
      { title: 'Website, privacy, terms, support', detail: 'manifest.md → §Company URL, §Privacy policy URL, §Terms of service URL, §Support contact' },
      { title: 'MCP server URL (Universal)', detail: `${pins.url} (manifest.md → §MCP server URL)` },
      { title: 'Authentication', detail: 'manifest.md → §Authentication. Partial: the server starts without authentication and individual tools prompt on demand. No demo credentials.' },
      { title: 'Scan Tools, then READ the result', detail: 'Fifteen tools. deployments_upload must show as optional sign-in and the other fourteen as requiring it: that is the securitySchemes the scan imports. If the scan shows no auth on any tool, stop; preflight and the server disagree with the portal and the snapshot would repeat the 1.0.0 record.' },
      { title: 'Version', detail: `${pins.version} (manifest.md → §Version, held to the live server by preflight)` },
      { title: 'Release notes', detail: 'manifest.md → §Release notes' },
      { title: 'Screenshots', detail: 'Upload assets/widget-light.png, assets/widget-dark.png, plus the in-context captures from assets/in-context/' },
      { title: 'Test cases', detail: 'tests/prompts.md: five positive and three negative. The review team runs these against the live plugin; they must reproducibly succeed.' },
    ],
  },
  {
    when: 'After clicking Submit for Review',
    why:  'You get an email confirmation with a Case ID. Submitting starts review; it does not publish. After approval, YOU publish from the portal, and only then do users get the new snapshot.',
    items: [
      {
        title: 'Record the submission',
        detail: `Flip the Prepared entry in docs/submission-history.md to Submitted with the Case ID (version ${pins.version}).`,
      },
      {
        title: 'Wait for review',
        detail: 'OpenAI publishes no fixed timeline; the outcome arrives on the same email thread (approved / changes requested / rejected). Record it in the same entry.',
      },
      {
        title: 'Publish the approved version, then record it as Published',
        detail: 'Append a Published entry to docs/submission-history.md. Preflight reads the latest Published entry as what the directory serves; until it is recorded, preflight keeps reporting the previous snapshot.',
      },
      {
        title: 'Prove the connect flow once',
        detail: 'Remove and re-add the plugin in ChatGPT, call an account tool, sign in. Proof: a new oauthConsent row for the ChatGPT client, and OpenAI fetching the /gpt protected-resource document on a live tail.',
      },
    ],
  },
];

console.log('\n\x1b[1mShipStatic ChatGPT plugin: submission checklist\x1b[0m');
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
