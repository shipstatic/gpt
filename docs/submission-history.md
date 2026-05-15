# Submission History

A log of OpenAI App submissions and their outcomes. Append one entry
per submission. Reviewers' notes, Case IDs, and acceptance / rejection
reasons live here so future-us can see what worked and what didn't.

Format per entry:

```
## YYYY-MM-DD — vX.Y.Z — <status>

**Case ID:** <from OpenAI email>
**Submitted by:** <human>
**Reviewer feedback:** <verbatim or summarized>
**Action taken:** <what we changed in response>
```

---

## 2026-05-15 — v0.6.0 — In review

**Case ID:** C-Zbh6GuQ45XKi
**Submitted by:** Constantin
**Reviewer feedback:** (pending — initial submission)
**Action taken:** (pending — awaiting review outcome)

Notes:
- First public submission of the ShipStatic ChatGPT App.
- Hosted MCP live at `https://mcp.shipstatic.com/gpt`, server reports v0.6.0.
- All preflight checks green at submission time.
- Domain verification token placed at `https://www.shipstatic.com/.well-known/openai-apps-challenge` and confirmed live before submit.
- Privacy and terms updated on `shipstatic.com` to disclose the anonymous-deploy flow.
- 4 listing screenshots uploaded: 2 widget-only (light + dark), 1 web in-context (dark), 1 iOS in-context.
- 5 test prompts submitted: 3 positive (Hello world, Hello reviewer, Pomodoro/Snake/Tic-tac-toe), 2 negative (oversize file, custom domain on anonymous endpoint), plus the operation-out-of-scope (delete) test.
