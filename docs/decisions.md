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

## 2026-05-15 — Pending: strip `via` and `status` from Deployment response?

**Context:** OpenAI's submission docs require: *"Remove unnecessary
PII, telemetry identifiers, timestamps, and auth secrets… ensure
tools return only what's strictly necessary for the user's request."*

The Deployment response shape includes two fields that may read as
telemetry to a reviewer inspecting the JSON the tool returns:

- **`via`** — internal analytics tag (`'mcp'`, `'gpt'`, `'cli'`,
  `'web'`, `'action'`, `'vsc'`, etc.). The agent has no use for it;
  the widget doesn't render it. **Strong candidate for removal on the
  anonymous path.** Querying analytics happens directly against the
  database, not the tool response — so removing it from the response
  is operationally lossless.
- **`status`** — typically `'success'` at response time (responses
  for failed deploys go through a different envelope via `isError`).
  Has some conceivable forward-looking utility (queued / partial /
  failed states) but currently always succeeds when present.
  Weaker case for removal; could be documented as "API contract"
  rather than "telemetry."

**Recommended execution path** (when the human decides to act):

1. Edit `cloudflare/api/src/routes/deployments.ts`
   `toDeploymentResponse()` — strip `via` (and optionally `status`)
   universally; the field stays write-only.
2. Update `npm/types` `Deployment` shape — make those fields absent
   from the response type.
3. Update `cloudflare/mcp/smoke.mjs` outputSchema check (line ~131)
   to drop the removed fields from the expected list.
4. Update `cloudflare/mcp/tests/server.test.ts` and
   `cloudflare/mcp/tests/widget.test.ts` if either references the
   removed fields.
5. Update `cloudflare/mcp/CLAUDE.md` "What renders from
   structuredContent" table accordingly.
6. Bump `cloudflare/mcp/src/version.ts` per the doc's Path A workflow
   (agent-facing change — schema shape affects the model).
7. Bump `integrations/mcp/package.json` to match (Path A requires
   both sides bump together).
8. `pnpm preflight` from `integrations/gpt/` — the advisory warning
   for `via`/`status` disappears.

**Blocking?** Yes. Submission should not happen with `via` in the
schema unless we deliberately document it as "API contract, not
telemetry" — and that argument is weak.

**Owner:** human.

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

## Pending decisions (require human input)

The blocking ones flow through to `scripts/checklist.mjs` for the
submission flow.

- [ ] **OpenAI org identity verification** — Individual or Business
      verification status in `https://platform.openai.com`. Unverified
      orgs are auto-rejected.
- [ ] **OpenAI project data residency** — must be Global, not EU.
- [ ] **Submitting account permissions** — `api.apps.write` +
      `api.apps.read`.
- [ ] **Strip `via` (and possibly `status`) from Deployment response**
      on the anonymous path. See the entry above for the execution
      path. **Real submission risk if left as-is.**
- [ ] **Deploy updated `/privacy` and `/terms` pages** with the
      anonymous-deploy disclosures from `policy/privacy.md` and
      `policy/terms.md`. Until this happens, the live pages disclose
      only the authenticated flow.
