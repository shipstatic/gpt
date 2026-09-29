// The plugin package, DERIVED.
//
// OpenAI's directory takes a plugin as a ZIP: `plugin.json` (the Agent
// Plugins manifest, with OpenAI's listing, review and publication fields
// under `extensions.com.openai`), `mcp.json` (the one MCP server) and the
// image files the manifest names. Both JSON files are a restatement of facts
// this repo already owns:
//
//   interface, publication  <- manifest.md's pinned headers and sections
//   review.test_cases       <- submission/test-cases.json, each positive
//                              case's tools checked against the live catalogue
//   mcp.json                <- the manifest's MCP server URL
//
// So the package is built, never drafted, and the two JSON files are
// committed so the diff between uploads is the review record. The build
// refuses a field the portal would refuse (a length, a category, a prompt
// naming a tool the door does not serve), and preflight refuses a committed
// file that is not the current build.
//
// The hosted tools are NOT in the package. After the first publication
// OpenAI scans the MCP server daily and takes eligible tool changes live on
// its own; a package upload is owed only when this file's inputs change.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PLUGIN_FILE = join(ROOT, 'plugin.json');
export const MCP_FILE = join(ROOT, 'mcp.json');
export const ZIP_FILE = join(ROOT, 'dist', 'shipstatic-plugin.zip');

const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';

/** The value the manifest uses for a pin nobody has filled yet. */
export const UNSET = 'TBD';

/** A pinned header of the form "## Name: `value`", the manifest's idiom. */
export function pinned(manifest, name) {
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

/** The bullets of a section, one string each. */
function bullets(manifest, name) {
  const items = section(manifest, name)
    .split('\n')
    .filter((line) => /^- /.test(line))
    .map((line) => line.replace(/^- /, '').trim());
  if (items.length === 0) throw new Error(`manifest.md: section "## ${name}" has no bullets`);
  return items;
}

/** The text as the portal shows it: no markdown emphasis, no backticks. */
function plain(markdown) {
  return markdown.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function within(label, value, max) {
  if (value.length > max) {
    throw new Error(`manifest.md: ${label} is ${value.length} characters; the portal allows ${max}`);
  }
  return value;
}

function https(label, value) {
  if (!/^https:\/\//.test(value)) throw new Error(`manifest.md: ${label} must be an https URL, got ${value}`);
  return value;
}

/**
 * Read the two inputs this repo owns. The third, the live catalogue, is the
 * caller's, so preflight reuses the listing it already fetched.
 */
export async function readPluginInputs() {
  const [manifest, testCases] = await Promise.all([
    readFile(join(ROOT, 'manifest.md'), 'utf8'),
    readFile(join(ROOT, 'submission', 'test-cases.json'), 'utf8').then(JSON.parse),
  ]);
  return { manifest, testCases };
}

/**
 * Build both files from the inputs and the live catalogue. Throws on anything
 * the portal would refuse, and on a test case naming a tool the door does
 * not serve.
 */
export function buildPlugin({ manifest, testCases }, liveTools) {
  const live = new Set(liveTools.map((t) => t.name));

  const name = pinned(manifest, 'Package name');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    throw new Error(`manifest.md: Package name ${name} must be lowercase letters, digits and single hyphens`);
  }
  const version = pinned(manifest, 'Version');
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`manifest.md: Version ${version} is not x.y.z`);

  const displayName = within('Plugin name', plain(section(manifest, 'Plugin name')), 30);
  const shortDescription = within('Subtitle', pinned(manifest, 'Subtitle'), 30);
  const longDescription = within('Long description', plain(section(manifest, 'Long description')), 4000);
  const developerName = within('Developer name', pinned(manifest, 'Developer name'), 80);
  const category = pinned(manifest, 'Category');

  const capabilities = bullets(manifest, 'Capabilities').map((c) => within('a capability', plain(c), 120));
  if (capabilities.length > 20) throw new Error('manifest.md: more than 20 capabilities');

  const defaultPrompt = bullets(manifest, 'Default prompts').map((p) => within('a default prompt', plain(p), 128));
  if (defaultPrompt.length > 3) throw new Error('manifest.md: more than 3 default prompts');
  if (defaultPrompt.some((p) => p.includes('@'))) throw new Error('manifest.md: a default prompt carries an @mention');
  if (new Set(defaultPrompt).size !== defaultPrompt.length) throw new Error('manifest.md: default prompts repeat');

  const websiteURL = https('Company URL', pinned(manifest, 'Company URL'));
  const supportURL = https('Support URL', pinned(manifest, 'Support URL'));
  const privacyPolicyURL = https('Privacy policy URL', pinned(manifest, 'Privacy policy URL'));
  const termsOfServiceURL = https('Terms of service URL', pinned(manifest, 'Terms of service URL'));
  const supportContact = pinned(manifest, 'Support contact');
  const mcpUrl = https('MCP server URL', pinned(manifest, 'MCP server URL'));

  const logo = './assets/icon-1024.png';
  const composerIcon = './assets/icon-480.png';
  for (const path of [logo, composerIcon]) {
    if (!existsSync(join(ROOT, path))) throw new Error(`${path} is named by the manifest and missing on disk`);
  }

  const { positive, negative } = testCases;
  if (positive.length !== 5) throw new Error(`test-cases.json: ${positive.length} positive cases; initial review wants exactly 5`);
  if (negative.length !== 3) throw new Error(`test-cases.json: ${negative.length} negative cases; initial review wants exactly 3`);
  for (const c of positive) {
    for (const field of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
      if (typeof c[field] !== 'string' || !c[field].trim()) throw new Error(`test-cases.json: "${c.prompt}" has no ${field}`);
    }
    within('a positive case description', c.description, 4000);
    for (const tool of c.tools_triggered.split(',').map((t) => t.trim())) {
      if (!live.has(tool)) throw new Error(`test-cases.json: "${c.prompt}" triggers ${tool}, which is not a live tool`);
    }
  }
  for (const c of negative) {
    for (const field of ['description', 'prompt', 'expected_behavior']) {
      if (typeof c[field] !== 'string' || !c[field].trim()) throw new Error(`test-cases.json: "${c.prompt}" has no ${field}`);
    }
  }

  // The recording is required for review and optional in the package, so an
  // unset pin leaves the field out and preflight names it as owed.
  const demoRecordingUrl = pinned(manifest, 'Demo recording URL');
  const review = {
    test_cases: {
      positive: positive.map(({ description, prompt, tools_triggered, expected_behavior }) => ({
        description,
        prompt,
        tools_triggered,
        expected_behavior,
      })),
      negative: negative.map(({ description, prompt, expected_behavior }) => ({
        description,
        prompt,
        expected_behavior,
      })),
    },
    ...(demoRecordingUrl === UNSET ? {} : { demo_recording_url: https('Demo recording URL', demoRecordingUrl) }),
    commerce: false,
    commerce_description: 'This plugin sells nothing and processes no payments.',
  };

  const releaseNotes = plain(
    section(manifest, 'Release notes')
      .split('\n')
      .filter((line) => line.startsWith('>'))
      .map((line) => line.replace(/^>\s?/, ''))
      .join('\n'),
  );
  if (!releaseNotes) throw new Error('manifest.md: Release notes has no blockquote to paste');

  const plugin = {
    $schema: PLUGIN_SCHEMA,
    name,
    version,
    description: shortDescription,
    author: { name: developerName, email: supportContact, url: websiteURL },
    homepage: websiteURL,
    license: 'MIT',
    extensions: {
      'com.openai': {
        interface: {
          displayName,
          shortDescription,
          longDescription,
          developerName,
          category,
          capabilities,
          websiteURL,
          supportURL,
          privacyPolicyURL,
          termsOfServiceURL,
          defaultPrompt,
          logo,
          composerIcon,
        },
        review,
        publication: { release_notes: releaseNotes },
      },
    },
  };

  const mcp = {
    $schema: MCP_SCHEMA,
    mcpServers: { [name]: { type: 'streamable-http', url: mcpUrl } },
  };

  return { plugin, mcp };
}

/** Every path the ZIP carries, relative to the repo root, derived from the manifest. */
export function packagedFiles(plugin) {
  const { logo, composerIcon } = plugin.extensions['com.openai'].interface;
  return ['plugin.json', 'mcp.json', ...[logo, composerIcon].map((p) => p.replace(/^\.\//, ''))];
}

/** A file as it is written and compared: stable key order, one newline. */
export function render(object) {
  return `${JSON.stringify(object, null, 2)}\n`;
}
