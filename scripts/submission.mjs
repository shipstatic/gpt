#!/usr/bin/env node
// Write `chatgpt-app-submission.json`, the file the plugin submission portal
// imports, from this repo's owners and the live catalogue. See
// scripts/lib/submission.mjs for what is derived from where.
//
//   pnpm submission                          # builds against prod
//   PREFLIGHT_MCP=... pnpm submission        # override the MCP endpoint
//
// Commit the result: the diff between two submissions is the review record,
// and preflight refuses a committed file that is not the current build.

import { writeFile } from 'node:fs/promises';
import { buildSubmission, readSubmissionInputs, renderSubmission, SUBMISSION_FILE } from './lib/submission.mjs';

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

let submission;
try {
  submission = buildSubmission(await readSubmissionInputs(), tools);
} catch (err) {
  // A refusal is the point: say what disagrees, and write nothing.
  console.error(`refused: ${err.message}`);
  process.exit(1);
}
await writeFile(SUBMISSION_FILE, renderSubmission(submission));

const n = Object.keys(submission.tools).length;
console.log(`wrote chatgpt-app-submission.json: ${n} tools, ${submission.test_cases.length} positive and ${submission.negative_test_cases.length} negative test cases, app info for "${submission.app_info.display_name}"`);
