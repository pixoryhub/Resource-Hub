# Pixory Creator Resource Hub

Full brief: [docs/BRIEF.md](docs/BRIEF.md) — read it before making changes.
It defines the build loop (§0), the stack (§3), the see-as-you-go rules
(§3.5), the design tokens (§4), and the checkpoint sequence (§13). Follow
those rules; this file is just the quick-reference.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS v4 (CSS-first config in `app/globals.css`, tokens from brief §4)
- Poppins via `next/font/google`
- Supabase (Postgres) — added in CP8, not yet wired up
- Vercel — deploy target, added in CP14

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint      # eslint
```

## Conventions

- **Data access goes through `lib/data/index.ts` only.** Never import
  `lib/data/fixtures.ts` or `lib/data/supabase.ts` directly from a component.
  Switch implementations with `DATA_SOURCE=fixtures|supabase` in `.env.local`
  (see `.env.local.example`). Defaults to fixtures.
- **No login wall during the build.** `DEV_NO_AUTH=true` is the default
  until CP8 — see brief §3.5.
- **UI copy is verbatim from the original app.** Don't improve wording that
  looks off — flag it instead. See brief §0.
- **Mobile-first.** Check every screen at phone width. Tap targets ≥44px,
  inputs at `font-size:16px` minimum.
- **`/dev`** lists every route and every state worth reviewing — add to it
  as new states are built (empty, loading, error, long-content).
- One checkpoint at a time (brief §13). Don't start the next one without
  sign-off.
- `git commit` at every checkpoint.

## Design tokens

Defined as CSS variables in `app/globals.css`, mapped into Tailwind via
`@theme inline` — use `bg-bg`, `text-text`, `text-text-muted`,
`text-text-faint`, `bg-surface`, `border-border`, `text-accent`, etc.
Dark mode switches via `[data-theme="dark"]` on `<html>` (see
`components/Header.tsx`'s `ThemeToggle`), not Tailwind's `dark:` variant.
The dark palette is 🔴 reconstructed, not verified — confirm with Emma.
