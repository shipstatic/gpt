---
name: publish-online
description: Publish a page, report, dashboard, slide deck, document, portfolio or small web app at a ShipStatic link anyone can open, with no account needed and optional built-in password protection. Use when the user asks to publish something, put it online or get a link others can open. Not for HTML the user only wants to see, download or keep as a file.
---

# Publish online

The user's own instructions come first. Where they say something different
from this workflow, follow them.

Publish what the user wants online with `deployments_upload`: a report, a
page, a dashboard, a slide deck, a document, a portfolio or a small web app.
Publish when the user has asked for it to be online. If they want to see a draft
first, show it and publish when they say so. Publishing needs no account, so
don't ask the user to sign in or connect anything first.

## Make the files

- Make it as HTML, with CSS, JavaScript, images and fonts as needed. It runs in
  the browser. There is no server, so no backend code, database or server-side
  form handling.
- Put the start page at `index.html`, at the root of the files you send. Link
  pages and files to each other with relative paths.
- A report or a single page can be one `index.html` with its CSS and
  JavaScript inside it, unless the user wants separate files. Charts and
  tables can be drawn with inline SVG, HTML and CSS.
- Send text files (HTML, CSS, JavaScript, JSON, SVG) as plain text. Use
  `encoding: "base64"` only for binary files such as images and fonts.
- Use only content the user gave you or that you can make yourself. Don't link
  to images or files at addresses you guessed.
- Don't publish passwords, keys, government ID numbers, health records or
  payment card numbers, even behind a password. Offer a version with those
  left out or replaced by made-up examples.

## Publish

- Send all the files in one upload for each version.
- If the user wants it private or behind a password, pass `password`. That is
  ShipStatic's built-in password protection, checked before any file is
  served. Don't build a password page or script into the HTML. Make up a new
  password that is hard to guess, unless the user chose one. Never ask for a
  password the user already uses somewhere else.

## Tell the user

Use what the upload returned:

- The link.
- Without an account, it stays up for 3 days. Show the claim link too:
  opening it and signing in keeps it in the user's ShipStatic account.
- The password, if you set one. A password the user never sees locks them out.

Keep the reply short. The links matter more than a summary of the files.

## When the user wants changes

Something published doesn't change. To change it, publish again: the user gets
a new link, and the earlier one keeps working until it expires. Say which link
is the new one, and that the claim link of the version they want to keep is
the one to open.

## When to stop or decline

- If the request needs a server (an API, a database, sign-in for the people
  who open the link), say that ShipStatic publishes static files such as HTML,
  and offer a static version if one would do the job.
- If the upload is refused, tell the user what the message says. Fix what you
  can, for example a file type that isn't allowed or files that are too large,
  and publish once more.

## With a connected account

If the user has connected a ShipStatic account, what they publish goes to that
account, with no claim link and no 3-day limit. It stays until they delete it,
unless they asked for it to expire. Bring up an account only when the user asks
to see or manage what they have published, or to use their own domain.
