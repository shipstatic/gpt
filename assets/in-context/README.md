# In-Context ChatGPT Screenshots

What this folder is for: screenshots of the App **actually running
inside ChatGPT**, showing a real conversation thread + the rendered
widget card. OpenAI uses these as the directory-listing imagery, and
review teams check them to confirm the App behaves the same way for
end users.

These cannot be captured by a script — they need a real human running
a real deploy in dev-mode ChatGPT. Save the resulting PNGs in this
folder.

## What OpenAI wants to see

At minimum, screenshots that show:

1. **A real deploy through the App**: the conversation thread with
   the user's prompt, the agent calling the tool, and the rendered
   widget card with a working URL.
2. **The card while the deploy runs**: its skeleton, a bar where each
   row will be, is normal and worth capturing once so reviewers know
   it is intentional.
3. **The card fully rendered**: the tile framing the live site, the URL
   with its copy button, the details row (files, size, time left), and
   the claim link, everything populated.
4. **Both ChatGPT web and ChatGPT mobile**: OpenAI explicitly tests on
   both. iOS or Android is fine; pick one (or do both).

## Before you start

Your **dev-mode App** needs to exist in OpenAI's developer console.
That's where you'll register the App and get an install URL that
connects it to your personal ChatGPT account.

1. Open `https://platform.openai.com/apps-manage`.
2. Create a draft App entry (or open the existing one).
3. Find the dev-mode install URL — it looks something like
   `https://chatgpt.com/g/apps/install/<id>`.

If the dev-mode App isn't registered yet, that's a separate piece of
work (Phase 3 of the submission flow). Without it there's no App to
connect.

## Capture procedure

### Web (desktop)

1. Go to `https://chatgpt.com` and sign in to the account that owns
   the dev-mode App.
2. Click your name (bottom-left) → **Settings** → **Apps**.
3. If **ShipStatic** appears in the list, you're connected. If not,
   click **Connect new App** and paste the dev-mode install URL.
4. Open a new chat. Pick a prompt from `../../submission/test-cases.json`;
   prompt #1 ("Create a Paris destination page and publish it online so I can share the link.")
   is the simplest and most repeatable.
5. Submit the prompt and wait for the deploy to complete. The card
   shows its skeleton while the deploy runs, then fills in; the tile
   shows the site itself once the site has loaded in it (an image
   placeholder stands in if that takes more than a second).
6. Take a screenshot of the whole conversation visible region (full
   ChatGPT chrome plus the rendered card).
7. Save as `web-light-card-rendered.png` (or `web-dark-` if you're in
   dark mode).

### Mobile (iOS or Android — pick one, ideally do both)

1. Open the ChatGPT app on your phone.
2. Sign in to the account that owns the dev-mode App.
3. Settings → Apps → ShipStatic should already be connected from the
   web step. If not, the install URL works in the mobile app too.
4. Start a new chat and submit the same prompt as the web step.
5. Wait for the card to render, screenshot, save as `ios-card.png` or
   `android-card.png`.

### Optional: capture the loading state and the password chip

For richer listing imagery:
- `web-light-loading.png`: screenshot the card's skeleton while the
  deploy runs, so reviewers see the loading state intentionally.
- `password-chip.png`: run prompt #4 (password-protected deploy) and
  screenshot the rendered card showing the password chip at the end of
  the details row (on a phone-width card the chip shows only its lock).

## Naming convention

| Filename | What it shows |
|---|---|
| `web-light-card-rendered.png` | Desktop, light theme, fully rendered card |
| `web-dark-card-rendered.png` | Desktop, dark theme |
| `web-light-loading.png` | Desktop, the card's skeleton while the deploy runs |
| `ios-card.png` | iOS mobile, fully rendered |
| `android-card.png` | Android mobile, fully rendered |
| `password-chip.png` | Any platform, password-protected deploy with the password chip |

## Quality bar

- Show the full card. Don't crop the URL or the claim line.
- Show enough surrounding ChatGPT chrome (logo, model selector, or
  composer) that it's recognisably ChatGPT.
- No personal info in the frame — no real email, no account name. Use
  a fresh dev session if needed.
- Native resolution. Don't downscale before saving.

## Why this can't be automated

Headless browser tooling could in principle render the widget, but it
can't drive a real ChatGPT conversation through the OAuth-protected
dev-mode App. The simplest path is human capture, done once before
submission, and re-captured if the card changes materially. It
changed materially on 2026-09-17 (the skeleton, the live-site tile,
the details row and the chip), so the captures in this folder predate
it and are owed again before the next submission.
