# Decisions Log

Every choice we made about this submission, dated. If you're picking
this up cold, jump straight to the **Pending decisions** list at the
bottom — those are the open items. The entries above are history,
preserved so future-us can see why each choice was made.

The Pending list is the **single source of truth** for open items —
`scripts/checklist.mjs` parses it live and surfaces the entries when
you run `pnpm checklist`.

---

## 2026-05-15 — Repurposed `integrations/gpt` for submission orchestration

**Decision:** The `integrations/gpt` submodule, previously seeded with
a README + LICENSE + icon, is now the source of truth for our half of
the OpenAI Apps submission. Scripts here verify the live MCP surface
and policy URLs; copy files (`manifest.md`, `tests/prompts.md`,
`policy/*.md`) are what the human pastes into the OpenAI dashboard.

**Why:** OpenAI's submission UI is interactive and stateful —
automation around their dashboard would be brittle. Building
automation around what we control (MCP, policy URLs, manifest
correctness) is durable.

**Locks in:** the repo layout (manifest / tests / policy / assets /
scripts / docs). The OpenAI-side dashboard work is downstream and
manual.

---

## 2026-05-15 — Policy drafts treat live pages as the structural anchor

**Decision:** `policy/privacy.md` and `policy/terms.md` are drafted as
**proposed updates** to the existing `shipstatic.com/privacy` and
`/terms` pages (last updated 2026-02-24), not as standalone documents.
They preserve the live controller (Enhanced SRL, Romania, EU),
jurisdiction (Romania), liability framing (30-day cap), and DSA
references; they **add** the anonymous-deploy disclosures the live
pages don't yet cover.

**Why:** The OpenAI review team reads the live page, not our draft. A
draft that diverges from the live page would mismatch under review.
Treating the live page as the anchor keeps everything consistent.

**Locks in:** the live `/privacy` and `/terms` pages remain
authoritative until updated. Deploying the updated content is `web/www/`
engineering, separate from this repo.

---

## 2026-05-15 — Categories: Developer Tools only

**Decision:** The App lists as **Developer Tools**. No fallback
category.

**Why:** "Productivity" was considered as a fallback but weakens the
App's identity in directory listings. The App's value prop is
"deploy static sites from agents" — unambiguously developer tooling.

---

## 2026-05-15 — Localization: en-US only at launch

**Decision:** Single locale at launch. No translated descriptions or
test prompts.

**Why:** First-version submission. Translations require coordinated
content review per locale; deferred.

**Locks in:** future locale additions trigger a resubmission with the
manifest's Localization section updated.

---

## 2026-05-15 — Resolved: `via` and `status` are functional metadata, retained

**Original concern:** OpenAI's submission docs say *"Remove unnecessary
PII, telemetry identifiers, timestamps, and auth secrets… ensure tools
return only what's strictly necessary for the user's request."* The
Deployment response includes `via` and `status` — a reviewer skimming
the JSON might initially read these as telemetry.

**Resolution: keep both. They are functional, user-visible metadata,
not platform telemetry.**

- **`via`** — the **creation-method tag**. Users who own deploys (the
  authenticated path) see this in the ShipStatic web app alongside
  file count, size, and creation time. It tells them *where the
  deploy came from*: `'gpt'` (this ChatGPT App), `'mcp'` (generic MCP
  client), `'cli'`, `'web'`, `'action'` (GitHub Action), `'vsc'` (VS
  Code extension). This is the same shape as Git showing
  `via: GitHub Actions` on a commit, or Vercel showing
  `Source: CLI` on a deploy. It supports user workflows around
  filtering, attribution, and provenance — explicitly *not*
  analytics-only.
- **`status`** — the deploy state. Currently always `'success'` when
  the response is sent (failures route through `isError`), but the
  field exists as the API contract for future queued/partial states.

For anonymous deploys (the hosted-MCP path), the user can convert to
an account-tied deploy via the claim URL and then sees both fields
in their dashboard — so even on the anonymous path the fields have
user-visible meaning, not just "platform-internal."

**Disclosure to OpenAI reviewers (if asked during review):** `via`
identifies the creation method so users can distinguish their
ChatGPT deploys from their CLI deploys in the ShipStatic web app.
It's not used for cross-user analytics, ad targeting, or any data
ShipStatic doesn't already disclose in its privacy policy.

**No code changes required.** The original execution path (strip
from `toDeploymentResponse()`, bump versions, redeploy) is
**cancelled**.

**Preflight** still surfaces `via` and `status` informationally so
anyone running the script can verify they're present as expected;
it no longer flags them as a blocker.

---

## 2026-05-15 — terms.md is operationally tight, legally thin

**Decision:** The terms draft mirrors the live page's structure and
specifics (Romania jurisdiction, 30-day liability cap, DSA
moderation framing). It does **not** add arbitration clauses,
detailed dispute resolution, indemnification, or warranty disclaimers
beyond what's already on the live page.

**Why:** The live page is what's deployed today. Legal-grade content
expansion is out of scope for App submission (OpenAI reviewers grade
clarity and presence, not legal exhaustiveness). Expansion can happen
on a separate track with actual legal review.

**Flag:** if launching at higher scale exposes us to disputes, the
terms should be expanded. Tracked here as a known limitation.

---

## 2026-05-15 — Cloudflare disclosure in privacy policy

**Decision:** Naming Cloudflare as our infrastructure sub-processor
in `policy/privacy.md` is **fine**, even though the README declares
"public-facing artifacts must not reveal that the hosted MCP lives in
a separate (private) `cloudflare/mcp/` repo."

**Why:** GDPR explicitly requires naming sub-processors. The live
privacy page already names Cloudflare. Naming the infrastructure
provider is *standard data-processor disclosure* — categorically
different from revealing the private-repo structure or implementation
details (Worker code, service bindings, etc.). The two concerns are
distinct.

---

## 2026-09-12 — The listing is a snapshot, and it is part of the release

**Decision:** treat OpenAI's published plugin as a PIN held by a registry
we do not control. OpenAI's docs: "Published plugins with MCP use reviewed
metadata snapshots. To change a remote snapshot, scan the MCP server,
submit a new version for review, and publish the approved version." So a
hosted MCP release is not done until the plugin is rescanned, resubmitted
and republished, and the last step of the version bump workflow in
`cloudflare/mcp/CLAUDE.md` now says so.

**Why:** the directory was found serving a 1.0.0 snapshot (scanned before
the door had OAuth) while the server reported 1.10.2. Every "Connect" in
ChatGPT died inside ChatGPT for twelve days; the tails showed OpenAI never
contacting us, which is exactly what a no-auth snapshot predicts.

**Locks in:** `docs/submission-history.md` records every PUBLISH (its
latest `Published` entry is what the directory serves); preflight reads
it and reports the gap; `.github/workflows/ci.yml` runs preflight weekly
and on push so a version flip in the other repo is noticed without a
runbook step being remembered.

---

## 2026-09-12 — Authentication posture has two wire halves

**Decision:** the "partial auth" posture (the server starts without
authentication; individual tools prompt on demand) is stated ON THE WIRE,
in the two places OpenAI's auth guide names, and the manifest's
§Authentication describes exactly that: every tool declares
`securitySchemes` (`noauth` + `oauth2` on `deployments_upload`, `oauth2`
on the fourteen account tools), and a credential refusal on `/gpt` is an
error result carrying `_meta["mcp/www_authenticate"]`. Preflight holds
both, so a scan cannot be taken against a server that would repeat the
1.0.0 record.

**Why:** OpenAI: "Without both halves ChatGPT will not show the linking UI
for that tool." Until 2026-09-12 the door emitted neither; it answered the
MCP specification's HTTP 401, which Claude and Cursor act on and ChatGPT
does not. The server-side design (a per-door challenge carrier, and a
derived catalogue declaration) is `cloudflare/mcp/CLAUDE.md`, "The door
model".

**Resolves:** the old checklist line "OAuth credentials: None, endpoint is
anonymous by design", which is plausibly how a no-auth record was born.

---

## 2026-09-12 — Vocabulary follows the vendor: plugin, not App

**Decision:** this repo says plugin, plugin submission portal, Plugins
Directory, MCP server URL, wherever it names OpenAI's things, because
OpenAI renamed them (the `/apps-sdk/` docs redirect to `/plugins/`). The
repo name `gpt` and the door `/gpt` are ours and stay.

**Why:** the same rule the estate applies to Stripe's vocabulary: a
synonym for a vendor's noun is a translation every reader has to hold.

---

## 2026-09-12 — Resolved: the first-submission prerequisites

Org identity verification, Global data residency, and the submitter's
permissions were open items for the first submission; that submission
happened and 1.0.0 was published, so all three are satisfied. The
`/privacy` and `/terms` updates shipped before the first submission too
(`submission-history.md`, 2026-05-15). The checklist keeps the identity
and permission checks as pre-portal reminders, since a role can change.

---

## 2026-09-12 — The portal's import file is built, never drafted

**Decision:** `chatgpt-app-submission.json` (the file the portal imports to
fill App Info, tool hint justifications and test cases) is DERIVED by
`pnpm submission` from the manifest's pinned headers, the live catalogue's
three hints per tool, `submission/justifications.json` and
`submission/test-cases.json`, and committed. OpenAI's Codex skill that
drafts the same file from the source tree is not used.

**Why:** the skill's output is a fourth copy of the tool hints kept in sync
by review. Deriving it makes the hints impossible to misstate (the build
refuses a justification bound to a value the live server no longer
declares) and makes the copy impossible to stage stale (preflight refuses a
committed file that is not the current build). The prose prompts file this
replaced restated the test cases in a shape nothing could check.

**Locks in:** the justification sentences and test cases are owned in
`submission/`; App Info fields are owned by `manifest.md`; hints are owned
by `@shipstatic/mcp` and read live.

---

## 2026-09-12 — Deferred: a plugin skill

**Decision:** this submission is MCP-only; it carries no skill. The portal
imports skills either as an uploaded bundle or from the MCP server through
the draft SEP-2640 skills extension (`io.modelcontextprotocol/skills`,
`skills/list`, `skills/get`, per-resource digests), which the hosted MCP
does not implement.

**Why:** a plugin skill is the workflow layer OVER the MCP tools (when to
call them, in what order, what the answer should contain). The estate's
existing `SKILL.md` (`npm/ship`, mirrored in the Gemini plugin) is a
different artifact: it teaches an agent to run the `ship` CLI, which
ChatGPT cannot do, so it must not be uploaded here. MCP-only plugins are
listed in the directory, and the server's `initialize` instructions already
carry the deploy and domain workflows the model needs.

**Expiry event:** a measured need for a ChatGPT-specific workflow the
instructions do not cover (a review note, or a user pattern the tool
descriptions cannot express). Then: author the skill over the MCP tools
and expose it from the hosted server through the extension, so it is
versioned and scanned with the server rather than uploaded by hand.

---

## 2026-09-13 — No reviewer credentials: OpenAI's rule is conditional

**Decision:** The portal's demo-credentials field stays empty, every
submitted test case is anonymous, and no reviewer account is provisioned
(the plan had grown a Google reviewer account with a sign-in gate and a
password-lane fallback; both are deleted).

**Why:** OpenAI's submission page, verbatim: "Configure authentication and
provide reviewer-ready demo credentials **if the server requires
sign-in**." and "**If your plugin requires authentication**, make sure the
provided demo credentials can complete each test without MFA, SMS, email
confirmation, or private-network access." This server does not require
sign-in: `deployments_upload` declares `noauth` beside `oauth2`, and
publishing works with no account. Every hosted release ChatGPT is to see is
a re-review, so a credential requirement would recur on every update; the
durable answer is not to have one. The connected `deployments_list` test
case was deleted for the same reason: a case that needs sign-in beside an
empty credentials field is the one contradiction a reviewer could hold
against the submission.

**If asked:** a review reply asking for credentials is answered with a
Google Workspace reviewer account provisioned at that moment, never
pre-emptively and never as a password lane on the platform.

**Locks in:** anonymous-only test cases; `manifest.md` §Authentication
naming the self-serve sign-in (Google or any email) as a fact, not an
offer.

---

## 2026-09-13 — The site password is not what OpenAI's data rule names

**Decision:** `deployments_upload` on `/gpt` accepts `password` like every
other door. The one-day exception (a door column withholding the input,
the description sentence and the instructions sentence on `/gpt`) is
removed from the server, and the submission's test cases include the
password-protected deploy again.

**Why:** OpenAI's rule forbids collecting "access credentials and
authentication secrets (such as API keys, MFA/OTP codes, or passwords)":
a user's own secrets to OTHER systems. A password the user chooses to lock
a site they are publishing is a setting for that site, sent only to
ShipStatic's own API, stored hashed, and shown back so the user can share
it. Treating it as a credential would have removed a real product feature
from the largest channel to satisfy a word. `manifest.md` §Tool surface
states the distinction in words, where a reviewer reads it.

**Residual:** a reviewer reading the word literally may ask; the manifest
sentence is the answer. If a review reply insists, revisit then.

---

## Pending decisions (require human input)

The blocking ones flow through to `scripts/checklist.mjs` for the
submission flow.

- [ ] **Republish the plugin at the live version** — Scan Tools, submit
      1.10.2, publish on approval, record a `Published` entry. Until then
      the directory serves the 1.0.0 snapshot and ChatGPT cannot start a
      sign-in.
- [ ] **In-context screenshots for the sign-in flow** — the connected
      flow now exists (account tools over OAuth); capture it once the
      republished plugin can be added, for the next listing update.
