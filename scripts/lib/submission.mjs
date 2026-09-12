// The portal's import file, DERIVED.
//
// OpenAI's plugin submission portal imports `chatgpt-app-submission.json`
// to fill the App Info, MCP Server and Testing sections of the form. Its
// shape is published (the `$schema` below) and its content is a restatement
// of facts this repo and the live server already own:
//
//   app_info            ← manifest.md's pinned headers and sections
//   tools[].annotations ← the LIVE catalogue's three hints, per tool
//   tools[].justifications ← submission/justifications.json, each sentence
//                            bound to the hint value it justifies
//   test_cases          ← submission/test-cases.json
//
// So the file is built, never drafted. OpenAI offers a Codex skill that
// drafts it from the source tree; that would be a fourth copy of the hints
// kept in sync by review, which is the category this estate refuses. The
// build refuses when a justification names a hint value the live server no
// longer declares, and preflight refuses when the committed file is not the
// current build, so the portal can never import a stale restatement.

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SUBMISSION_FILE = join(ROOT, 'chatgpt-app-submission.json');
export const SCHEMA_URL = 'https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json';

const CATEGORIES = [
  'BUSINESS',
  'COLLABORATION',
  'DESIGN',
  'DEVELOPER_TOOLS',
  'EDUCATION',
  'ENTERTAINMENT',
  'FINANCE',
  'FOOD',
  'LIFESTYLE',
  'NEWS',
  'PRODUCTIVITY',
  'SHOPPING',
  'TRAVEL',
];

const HINTS = ['readOnlyHint', 'openWorldHint', 'destructiveHint'];
const JUSTIFICATION_KEY = {
  readOnlyHint: 'read_only_justification',
  openWorldHint: 'open_world_justification',
  destructiveHint: 'destructive_justification',
};

/** A pinned header of the form "## Name: `value`", the manifest's idiom. */
function pinned(manifest, name) {
  const value = manifest.match(new RegExp(`^##\\s+${name}:\\s+\`([^\`]+)\`\\s*$`, 'm'))?.[1];
  if (!value) throw new Error(`manifest.md: no pinned header "## ${name}: \`<value>\`"`);
  return value;
}

/** The prose under a "## Name" header, up to the next header or rule. */
function section(manifest, name) {
  const m = manifest.match(new RegExp(`^##\\s+${name}\\s*\\n([\\s\\S]*?)(?=^##\\s|^---\\s*$)`, 'm'));
  if (!m) throw new Error(`manifest.md: no section "## ${name}"`);
  return m[1].trim();
}

/** The long description as the portal shows it: no markdown emphasis. */
function plain(markdown) {
  return markdown.replace(/\*\*/g, '').trim();
}

/**
 * Read the three inputs this repo owns. The fourth (the live catalogue) is
 * the caller's, so a test can hand in a fixture and the preflight can reuse
 * the listing it already fetched.
 */
export async function readSubmissionInputs() {
  const [manifest, justifications, testCases] = await Promise.all([
    readFile(join(ROOT, 'manifest.md'), 'utf8'),
    readFile(join(ROOT, 'submission', 'justifications.json'), 'utf8').then(JSON.parse),
    readFile(join(ROOT, 'submission', 'test-cases.json'), 'utf8').then(JSON.parse),
  ]);
  return { manifest, justifications, testCases };
}

/**
 * Build the import file from the inputs and the live catalogue. Throws on
 * any disagreement between a justification and the hint it claims to
 * justify, and on any tool present on one side and absent on the other.
 */
export function buildSubmission({ manifest, justifications, testCases }, liveTools) {
  const live = new Map(liveTools.map((t) => [t.name, t]));
  const justified = Object.keys(justifications).filter((k) => !k.startsWith('$'));

  const missingJustification = [...live.keys()].filter((n) => !justified.includes(n));
  const missingTool = justified.filter((n) => !live.has(n));
  if (missingJustification.length || missingTool.length) {
    throw new Error(
      `tools and justifications disagree: no justification for [${missingJustification}], no live tool for [${missingTool}]`,
    );
  }

  const tools = {};
  for (const name of [...live.keys()].sort()) {
    const annotations = live.get(name).annotations ?? {};
    const entry = { annotations: {}, justifications: {} };
    for (const hint of HINTS) {
      const declared = annotations[hint];
      const { value, why } = justifications[name][hint] ?? {};
      if (typeof declared !== 'boolean') throw new Error(`${name}: the live catalogue declares no ${hint}`);
      if (value !== declared) {
        throw new Error(`${name}: justifications.json says ${hint} is ${value}, the live catalogue says ${declared}`);
      }
      if (typeof why !== 'string' || !why.trim()) throw new Error(`${name}: no sentence for ${hint}`);
      entry.annotations[hint] = declared;
      entry.justifications[JUSTIFICATION_KEY[hint]] = why;
    }
    tools[name] = entry;
  }

  const category = pinned(manifest, 'Category');
  if (!CATEGORIES.includes(category)) throw new Error(`manifest.md: Category ${category} is not one the portal accepts`);
  const subtitle = pinned(manifest, 'Subtitle');
  if (subtitle.length > 30) throw new Error(`manifest.md: Subtitle is ${subtitle.length} characters; the portal allows 30`);
  const description = plain(section(manifest, 'Long description'));
  if (description.length > 4000) throw new Error('manifest.md: Long description exceeds the portal\'s 4000 characters');

  const positive = testCases.positive.map((c) => ({
    description: c.description,
    user_prompt: c.user_prompt,
    file_attachment_urls: null,
    tools_triggered: c.tools_triggered,
    expected_output: c.expected_output,
    expected_output_url: null,
  }));
  const negative = testCases.negative.map((c) => ({
    description: c.description,
    user_prompt: c.user_prompt,
    file_attachment_urls: null,
    tools_triggered: null,
    expected_output: c.expected_output,
    expected_output_url: null,
  }));
  if (positive.length < 5) throw new Error(`test-cases.json: ${positive.length} positive cases; the portal wants at least 5`);
  if (negative.length < 3) throw new Error(`test-cases.json: ${negative.length} negative cases; the portal wants at least 3`);
  for (const c of positive) {
    if (!live.has(c.tools_triggered)) throw new Error(`test-cases.json: "${c.user_prompt}" triggers ${c.tools_triggered}, which is not a live tool`);
  }

  return {
    $schema: SCHEMA_URL,
    schema_version: 1,
    app_info: {
      display_name: section(manifest, 'Plugin name'),
      subtitle,
      description,
      category,
    },
    tools,
    test_cases: positive,
    negative_test_cases: negative,
  };
}

/** The file as it is written and compared: stable key order, one newline. */
export function renderSubmission(submission) {
  return `${JSON.stringify(submission, null, 2)}\n`;
}
