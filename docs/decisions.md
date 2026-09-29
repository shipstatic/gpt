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

## 2026-09-30 — The listing is a package, and the tools follow the server

**Decision:** the submission is a plugin ZIP (`plugin.json`, `mcp.json`, the
icons), built by `pnpm package` from `manifest.md` and the test cases and
committed as its two JSON files. The hosted tools are not in it. After the
first publication OpenAI scans the MCP server daily and takes eligible tool
changes live on its own, holding a flagged change against the last approved
definition; a package upload is owed only when a listing fact changes.

**Why:** OpenAI's submission documentation moved to this shape (read
2026-09-30: "Submit the package you've already built as a ZIP", "changes to
your MCP server are picked up automatically", "hosted tool changes are
checked directly from your server"). The 2026-09-12 decision below ("the
listing is a snapshot, and it is part of the release") described the
previous portal, and its consequence, a rescan-resubmit-republish step on
every hosted release, is deleted with it. `pnpm preflight` keeps the clock
it gave this repo, pointed at what the scan now evaluates: a change the scan
would hold is found here before the scan runs.

**Supersedes:** 2026-09-12 "The listing is a snapshot" (the snapshot
doctrine, the `Published` entry preflight parsed, the portal's import file
and its annotation justifications, which OpenAI no longer takes: "Annotation
justifications are no longer required"). `chatgpt-app-submission.json` and
`submission/justifications.json` are deleted.

**Locks in:** the package version is the PACKAGE's, moved independently of
the server's; `manifest.md`'s `## Version` is 1.1.0 for the first upload,
the directory's 1.0.0 having been published through the previous form; the
release notes describe the package version, not the server's.

**Owed, named by the checklist:** the domain-verification challenge lives at
`www.shipstatic.com`, a sibling of `mcp.shipstatic.com`; today's rule wants
the MCP hostname or a parent, so the portal's challenge URL is read before
anything is built for it. And the server must stay compatible with the
approved tool schemas until a held update goes live.

---

## 2026-09-30 — Reviewer credentials are required, and the account is permanent

**Decision:** the reviewer Google account (`shipstatic.reviewer@gmail.com`)
is entered in the portal's Review details as REQUIRED credentials, its
fixtures stay as they are for every later review, and its password is
rotated only if it leaks, never on approval. Four of the five positive test
cases run on that account.

**Why:** OpenAI's submission page, read 2026-09-30: reviewer credentials are
needed "if sign-in is required", the account "should work immediately
without MFA approval, email or SMS codes, magic links, or private-network
access", and "keep the test account and sample data available for
subsequent reviews". Fourteen of fifteen tools need an account, and the
review team tests the integration, not one tool; five anonymous
`deployments_upload` cases exercised none of the release's principal
feature. The 2026-09-13 decision ("OpenAI's rule is conditional") and the
2026-09-14 one ("a courtesy", "rotate on approval") read the previous
guidance and are superseded.

**What it does not decide:** no password lane on the platform. The reviewer
path is Google sign-in, and the one step in it that could count as an
"approval" is Google's own new-device verification. The checklist requires a
fresh-device proof before submission; if Google challenges, the question
goes to OpenAI's submission support before anything is built.

---

## 2026-09-30 — The site password is an open question, not a settled one

**Decision:** `deployments_upload` keeps `password` on `/gpt`, no test case
exercises it, and the manifest says the question is open. The 2026-09-13
entry's reasoning (a site setting, the hosting industry's word, sent to our
own API) stands as the argument; it is not a ruling, and none exists.

**Why:** OpenAI's restricted-data rule names "passwords" without saying
whose, and an external audit (2026-09-30) declined to treat the argument as
clearance. Nobody in reach can grant an exception: the question goes to
OpenAI's submission support or the OpenAI contact, in these words: "May an
MCP tool accept a newly chosen visitor password solely to enable password
protection on a website it creates, or must that configuration happen
outside ChatGPT under the restricted-data policy?"

**If refused:** the field leaves the `/gpt` door alone, through the hosted
server's per-door composition, and protected sites become a console-only
setting from ChatGPT. Renaming the field settles nothing and is not the
fallback.

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

**Precedent (checked 2026-09-13):** Vercel's feature is "Password
Protection" and its API field is `password`; Netlify's is "Password
Protection" with "Basic password protection"; Webflow, Squarespace, Wix and
Framer all "password protect" a site. The word is the hosting industry's,
and the Accidental Builder arrives knowing it. A platform-wide rename (to
`passcode`, Zoom's 2020 precedent for disambiguating a guest code from an
account password) was weighed and declined: four `latest` majors and a D1
migration to depart from the vocabulary of every neighbouring product, for
a reviewer risk the precedent already answers.

**Residual:** a reviewer reading the word literally may ask; the manifest
sentence names the precedent. If a review reply insists, revisit then.

---

## 2026-09-14 — A reviewer account is provided, as a courtesy rather than a requirement

**Decision:** the portal's demo-credentials field carries a Google login we
own (`shipstatic.reviewer@gmail.com`, display name "ShipStatic Reviewer"),
already signed in to ShipStatic once, on the sponsored plan, populated with
three labelled deployments and one custom domain awaiting DNS. Every test
case still runs anonymously; the account is for the reviewer's own
exploration of the fourteen account tools.

**Why:** the 2026-09-13 decision stands (OpenAI's rule is conditional and
this server needs no sign-in), so nothing is owed. But the Claude listing's
reviewer account proved worth having, and a Google account we own costs no
product work: no password lane on the platform, no inbox to hand over.
"Something similar" for this listing is the same account shape under an
identity OpenAI's reviewers can type.

**Fixtures** (deployment hostnames are in `docs/submission-history.md`):
`review,hello` a single page; `review,welcome` a two-page site with a
stylesheet and a link between the pages; `review,private` a page locked with
the site password `hello-reviewer`; `review-team.shipstatic.com`, a platform
subdomain on the hello page, live; `reviewer.exampledomain.xyz`, a custom
domain the operator owns and pointed at the platform, linked to the welcome
site, verified and live. All safe
to mutate or delete; the pages name no store, no host and no vendor.

**Rotate on approval:** the Google password and the account's API key
(hint `ship-…1580`), the day the listing is approved.

---

## Pending decisions (require human input)

The blocking ones flow through to `scripts/checklist.mjs` for the
listing flow.

- [ ] **Record the walkthrough and pin its URL** — a reviewer-accessible
      recording of the five positive cases on the reviewer account, pinned as
      `## Demo recording URL` in `manifest.md`. Preflight is red until it is.
- [ ] **Prove the reviewer sign-in from a fresh device** — a clean browser
      profile, no Google session, sign in to my.shipstatic.com as the reviewer
      account. A Google code or device approval is the question for OpenAI
      submission support.
- [ ] **Ask about the site password** — the question in the 2026-09-30
      entry above, to OpenAI submission support or the OpenAI contact. Until
      answered the field stays and no case exercises it.
- [ ] **Read the domain-verification challenge URL the portal shows** — the
      token sits at `www.shipstatic.com`, a sibling of the MCP host; if the
      portal names `mcp.shipstatic.com` or `shipstatic.com`, the token needs a
      home there before the connection completes.
- [ ] **Upload the package and submit** — `pnpm package`, upload the ZIP,
      connect the server, enter the credentials, submit; record it in
      `docs/submission-history.md`. Until published, the directory serves the
      1.0.0 listing and ChatGPT cannot start a sign-in.
