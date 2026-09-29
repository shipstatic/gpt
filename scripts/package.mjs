#!/usr/bin/env node
// Write `plugin.json` and `mcp.json` from this repo's owners and the live
// catalogue, then zip them with the images they name into
// `dist/shipstatic-plugin.zip`, the file the portal takes. See
// scripts/lib/plugin.mjs for what is derived from where.
//
//   pnpm package                          # builds against prod
//   PREFLIGHT_MCP=... pnpm package        # override the MCP endpoint
//
// Commit the two JSON files: the diff between two uploads is the review
// record, and preflight refuses a committed file that is not the current
// build. The ZIP is not committed; it is the JSON plus images, rebuilt on
// demand.

import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { buildPlugin, MCP_FILE, packagedFiles, PLUGIN_FILE, readPluginInputs, render, ROOT, ZIP_FILE } from './lib/plugin.mjs';

const MCP = process.env.PREFLIGHT_MCP ?? 'https://mcp.shipstatic.com';

const res = await fetch(`${MCP}/gpt`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
});
const tools = (await res.json())?.result?.tools;
if (!Array.isArray(tools)) {
  console.error(`tools/list on ${MCP}/gpt answered ${res.status} with no tools`);
  process.exit(1);
}

let built;
try {
  built = buildPlugin(await readPluginInputs(), tools);
} catch (err) {
  // A refusal is the point: say what disagrees, and write nothing.
  console.error(`refused: ${err.message}`);
  process.exit(1);
}
await writeFile(PLUGIN_FILE, render(built.plugin));
await writeFile(MCP_FILE, render(built.mcp));

await mkdir(new URL('.', `file://${ZIP_FILE}`), { recursive: true });
await rm(ZIP_FILE, { force: true });
// The system zip, present on macOS and on every GitHub runner; `-X` leaves
// the host's extended attributes out so the archive is the files and nothing
// about the machine that made them.
execFileSync('zip', ['-q', '-X', ZIP_FILE, ...packagedFiles(built.plugin)], { cwd: ROOT, stdio: 'inherit' });

const { review } = built.plugin.extensions['com.openai'];
console.log(
  `wrote plugin.json (${built.plugin.name} ${built.plugin.version}), mcp.json, and ${relative(ROOT, ZIP_FILE)}: ` +
    `${review.test_cases.positive.length} positive and ${review.test_cases.negative.length} negative test cases` +
    (review.demo_recording_url ? '' : '; the demo recording URL is still unset'),
);
