---
name: publish-a-site
description: Publish a page, report, portfolio or small web app as a live website with a link to share, with no account needed. Use when the user asks to put something online, publish it, share it as a website or get a link to it, including with a password.
---

# Publish a site

Put what the user asked for online with `deployments_upload`. Publishing needs
no account, so publish straight away. Don't ask the user to sign in or connect
anything first.

## Make the files

- Make a complete static site: HTML, CSS, JavaScript, images and fonts. Nothing
  runs on a server, so there is no backend code, database or server-side form
  handling.
- Put the start page at `index.html`, at the root of the files you send. Link
  pages and files to each other with relative paths.
- For a small site, one `index.html` with its CSS and JavaScript inside it is
  enough, unless the user wants separate files.
- Send text files (HTML, CSS, JavaScript, JSON, SVG) as plain text. Use
  `encoding: "base64"` only for binary files such as images and fonts.
- Use only content the user gave you or that you can make yourself, such as
  text, inline SVG and CSS. Don't link to images or files at addresses you
  guessed.

## Publish

- Call `deployments_upload` once, with all the files.
- If the user wants the site private or behind a password, pass `password`.
  That is ShipStatic's built-in password protection, checked before any file
  is served. Don't build a password page or script into the site. If the user
  didn't choose a password, make up one that is hard to guess.

## Tell the user

- The link to the site.
- Without an account, the site stays up for 3 days. Show the claim link too:
  opening it and signing in keeps the site in the user's ShipStatic account.
- The password, if you set one. A password the user never sees locks them out.

Keep the reply short. The links matter more than a summary of the files.

## When the user wants changes

A published site doesn't change. To change it, publish again: the user gets a
new link, and the earlier one keeps working until it expires. Say which link is
the new one, and that the claim link of the version they want to keep is the
one to open.

## When to stop or decline

- If the request needs a server (an API, a database, sign-in for the site's
  visitors), say that ShipStatic hosts static sites, and offer a static version
  if one would do the job.
- If the upload is refused, tell the user what the message says. Fix what you
  can, for example a file type that isn't allowed or a site that is too large,
  and publish once more.

## With a connected account

If the user has connected a ShipStatic account, the site goes to that account
and stays: there is no claim link and no 3-day limit. Bring up an account only
when the user asks to see or manage their sites, or to use their own domain.
