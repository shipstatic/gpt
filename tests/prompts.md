# Test Prompts

OpenAI's review team runs these against the live App. Each prompt
must reproducibly succeed: the agent should call `deployments_upload`,
the deploy should return a card with a working URL, and the rendered
widget should display the screenshot, claim URL, and metadata.

Each prompt below has three parts:
1. **Prompt** — what the user types into ChatGPT.
2. **Expected agent behavior** — what the agent should do behind the
   scenes (which tool, which arguments).
3. **Expected user-visible outcome** — what the user actually sees in
   the chat, which is what the review team is grading.

Prompts #1, #2, and #4 read as realistic user requests. Prompt #3 is
deliberately tighter — designed so a reviewer can verify the deploy
with a single `curl` check.

---

## 1. Single-file deploy (simplest path)

**Prompt:**
> Deploy a single-page website that says "Hello world" in big bold text.

**Expected agent behavior:**
- Generates an HTML file (single `index.html` with inline CSS is fine).
- Calls `deployments_upload` with the file as `utf-8` content.
- Does not require the user to confirm — anonymous deploys need no
  confirmation gate.

**Expected user-visible outcome:**
- Deploy card renders with a `*.shipstatic.com` URL (e.g.
  `https://glitchy-seed-abc123.shipstatic.com`).
- File count "1 file", small byte count.
- Screenshot tile shows the "Hello world" page (may show
  "Preview loading…" for up to ~30s before the image lands).
- "Claim to keep forever:" line with a claim URL.

---

## 2. Multi-file site (project structure)

**Prompt:**
> Build me a landing page for a fictional coffee shop called "Blackbird
> Coffee" — include an index.html, a styles.css file, and a small
> about.html page. Deploy it.

**Expected agent behavior:**
- Generates 3 files with reasonable cross-links (`<link rel=stylesheet>`,
  `<a href="about.html">`).
- Calls `deployments_upload` once with all three files in the same call.

**Expected user-visible outcome:**
- Deploy card renders.
- File count "3 files".
- URL navigates to a working landing page; the styles apply; the
  `/about.html` link works.

---

## 3. Deterministic content + verifiable response

**Prompt:**
> Deploy an HTML page whose `<h1>` reads exactly "Hello reviewer" and
> whose `<title>` reads "ShipStatic test". Then tell me the URL.

**Expected agent behavior:**
- Generates a single `index.html` with the literal `<h1>Hello
  reviewer</h1>` and `<title>ShipStatic test</title>`.
- Calls `deployments_upload`.
- Echoes the deployment URL back in the response text.

**Expected user-visible outcome:**
- Deploy card renders with a `*.shipstatic.com` URL.
- Fetching the URL returns HTML containing the exact `<h1>` and
  `<title>` strings (reviewer can verify with a single `curl`).
- File count "1 file", small byte count.

---

## 4. Password-protected deploy

**Prompt:**
> Deploy a one-page "coming soon" landing page and protect it with the
> password "demo123".

**Expected agent behavior:**
- Generates the HTML.
- Calls `deployments_upload` with `password: "demo123"`.
- Surfaces the password in conversation (or confirms it back to the
  user).

**Expected user-visible outcome:**
- Deploy card renders.
- **Lock chip appears in the meta row** — this is the visual
  acknowledgement that the deploy is password-protected.
- Visiting the URL prompts for the password before the page renders.

---

## Notes for the review team

- **No account, no API key, no MFA.** The endpoint is anonymous. Any
  test the team runs will work without setup.
- **Screenshot capture is async.** The card renders immediately with
  the screenshot URL; the actual image may take 5–30 seconds to land.
  The widget polls and shows "Preview loading…" until it does. If the
  placeholder persists past ~1 minute, the capture pipeline failed —
  this is rare in production.
- **Error handling** is robust but not part of the test suite above —
  oversize uploads (>20 MB per file, >50 MB total), malformed input,
  or rate-limit exhaustion surface as conversational error messages
  from the agent with no card rendered. Reviewer can verify by
  requesting a deliberately oversized deploy if curious.
- **Deploys expire in 3 days.** Test deploys auto-clean. The claim URL
  in the card converts an anonymous deploy to a permanent one if
  followed.
