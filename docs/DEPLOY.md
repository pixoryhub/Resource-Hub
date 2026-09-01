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

**This is the step that's easy to miss** — without it, the site will build
and load fine, but Admin mode will be silently switched off everywhere.

In Netlify: **Site configuration → Environment variables**, add:

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | Whatever password coaches should use for Admin mode |

`DATA_SOURCE` doesn't need to be set — it defaults to the seeded fixture
content, which is what's live right now.

## 4. Deploy

Push to `main` (or trigger a deploy in the Netlify dashboard) and it builds.

## What to check after the first deploy

- Every page loads (Resource Hub, Creator Hub, Coaching Flag, Shot List).
- Sign up for a new profile and confirm it logs you in.
- Turn on Admin mode with the password you set in step 3.
- Add a resource with a link, click "Use as thumbnail" — confirms the
  `/api/link-preview` function works on Netlify, not just locally.

## Why this should just work

- All the interactive pages (Creator Hub, Shot List, Coaching Flag) run
  entirely in the visitor's browser — ticking things, logging in, all of
  it — so there's nothing server-side to break there.
- The two things that do run server-side are small Next.js API routes
  (`/api/admin-auth`, `/api/link-preview`). Netlify's Next.js plugin turns
  these into serverless functions automatically — same code, same
  behaviour, just running on Netlify's infrastructure instead of the local
  dev server.

## The honest limitation

Creator profiles and their data (ticks, shot lists, coaching flags) live in
each person's own browser (see `docs/BRIEF.md` and `lib/localAuth.tsx`),
not in a shared database. That means:

- A creator's data won't follow them to a different device or browser.
- Clearing browser data / a new device means starting fresh.

This is intentional for now — it's what lets the app work today without a
database. Real accounts that sync everywhere come with CP8/CP9 (Supabase).
