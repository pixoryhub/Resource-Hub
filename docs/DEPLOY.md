# Deploying to Netlify

This app is a standard Next.js app, so Netlify's normal Next.js support
handles it — no special setup beyond what's already in this repo
(`netlify.toml`).

## 1. Push this repo to GitHub

Netlify deploys from GitHub (or GitLab/Bitbucket). If this repo isn't on
GitHub yet:

```bash
git remote add origin https://github.com/<your-org>/<repo-name>.git
git push -u origin main
```

## 2. Connect the site in Netlify

In the Netlify dashboard: **Add new site → Import an existing project** →
pick this GitHub repo. Netlify will read `netlify.toml` automatically —
build command and the Next.js plugin are already configured, nothing to
change here.

If this repo lives in a subfolder (not at the repo root), set **Base
directory** to that subfolder in the site's build settings.

## 3. Set environment variables

**This is the step that's easy to miss** — without these, the site will
build and load fine, but Admin mode and creator sign-up/login will be
silently switched off.

In Netlify: **Site configuration → Environment variables**, add:

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | Whatever password coaches should use for Admin mode |
| `AUTH_SECRET` | A long random string — signs creator session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

`DATA_SOURCE` doesn't need to be set — it defaults to the seeded fixture
content, which is what's live right now.

Creator profiles and per-creator data are stored in **Netlify Blobs**,
which Netlify provisions automatically for every site — nothing to set up
or sign up for separately, as long as `AUTH_SECRET` above is set.

## 4. Deploy

Push to `main` (or trigger a deploy in the Netlify dashboard) and it builds.

## What to check after the first deploy

- Every page loads (Resource Hub, Creator Hub, Coaching Flag, Shot List).
- Sign up for a new profile and confirm it logs you in.
- Turn on Admin mode with the password you set in step 3.
- Add a resource with a link, click "Use as thumbnail" — confirms the
  `/api/link-preview` function works on Netlify, not just locally.

## Why this should just work

- The pages themselves (Creator Hub, Shot List, Coaching Flag) run
  entirely in the visitor's browser — ticking things, expanding cards, all
  of it.
- Sign-up/login and everything a creator saves (ticks, shot lists, coaching
  flags) go through small Next.js API routes (`/api/auth`,
  `/api/creator-data`, `/api/admin-auth`, `/api/link-preview`) backed by
  Netlify Blobs. Netlify's Next.js plugin turns these into serverless
  functions automatically — same code, same behaviour, just running on
  Netlify's infrastructure instead of the local dev server.

## Creator accounts now work from any device

A creator's name + 4-digit PIN, and everything they save, live in Netlify
Blobs — not in one browser's `localStorage` — so logging in from a new
phone or a different computer picks up the same profile and data, as long
as `AUTH_SECRET` (see step 3) stays the same across deploys of this site.

Locally (`next dev`), sign-up/login will show "Couldn't reach storage" —
Netlify doesn't inject Blobs credentials outside its own infrastructure.
Either run `netlify dev` instead (after `netlify link`), or set
`NETLIFY_SITE_ID` / `NETLIFY_AUTH_TOKEN` in `.env.local` to point at the
deployed site's blob store. See `.env.local.example` for details.
