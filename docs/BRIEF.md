# Pixory Creator Resource Hub — Rebuild Brief

**For:** Claude Code
**Owner:** Emma (Pixory, Breakthrough Creator Community)
**Date:** 1 September 2026

**Confidence markers used throughout:**
🟢 verified from the live site or the Loom walkthrough · 🟡 reconstructed from internal documentation · 🔴 unknown, must be confirmed before building

---

## 0. How we work — read this first

**Emma wants to see the thing as it is being built, and correct it along the way.** That shapes everything below. This is not a spec to disappear with for two days and return with a finished app.

**The loop, every single time:**

1. Build **one checkpoint** from §13 — no more.
2. Get the dev server running (`npm run dev`) and make sure the page actually renders without errors.
3. **STOP.** Tell Emma exactly what to open — the URL, the path to click, and the three or four specific things to look at.
4. Wait for her feedback. Fix what she flags. Show her again.
5. Only then move to the next checkpoint.

**Rules for this loop:**

- **Never batch two checkpoints.** A checkpoint is a thing she can look at and react to. Two at once means she is reviewing your guesses on top of your guesses.
- **Make it visible before making it real.** Every screen is built with fixture data first so it can be seen and corrected before any database, login or API exists. See §3.5.
- **No login walls during the build.** A dev bypass means Emma can click straight into any page. Auth arrives late (Checkpoint 8), not early.
- **Keep the dev server running** between checkpoints so she can refresh rather than wait on a restart.
- **If something in this brief turns out to be wrong when you see it on screen, say so.** The brief is reconstructed from screenshots and video walkthroughs, not from the original source. It will be wrong somewhere.
- **UI copy in this brief is verbatim from the original app and must be reproduced exactly.** ~80 creators were trained on this wording; changing labels costs us re-teaching. If a label reads oddly on screen, flag it rather than improving it.
- **Anything marked 🔴 or listed in §15: ask Emma. Do not invent.**

**Git:** run `git init` and commit at every checkpoint from the very beginning — local commits cost nothing and mean a bad change is one command away from being undone. Pushing to GitHub and deploying can wait until Emma is happy with what she is looking at, but it must happen before this goes anywhere near the creators (§2).

Save this file as `docs/BRIEF.md` and keep a `CLAUDE.md` at the root with the stack, commands and conventions.

---

## 1. Situation and mission

The Pixory Creator Resource Hub was built on Manus and hosted at `pixoryhub-ubzgzjut.manus.space`. On 23 August 2026 Manus deleted WebDev data as part of its separation from Meta. No backup was taken, the code is gone, support has confirmed there is no recovery, and there is no Wayback snapshot. Creator accounts, every saved shot list, and all video-completion history are gone with it.

**Mission:** rebuild the hub so that it (a) looks and behaves like the app the creators already know, and (b) can never be lost this way again.

**Who uses it:**
- ~80 active creators in the Breakthrough community (up 12.6% week on week), producing ~1,200 posts a week between them. Mobile-heavy — they plan on a laptop and tick things off on a phone while filming.
- **Coaches** (Emma, Erriel and others), who use creators' completion data to spot where people are stuck and to decide what content to brief next. Coaches are a real second user type, not just admins.

Low traffic, high emotional stakes.

**Surviving source material:**
- Loom "Breakthrough Content Hub Updated Features" (Erriel, ~4 min) — transcript mined for this brief; the primary record of the Creator Hub completion tracking and the Coaching Flag.
- Loom "Pixory Shot List Generator – 18 August 2026" (~3 min) — transcript mined for this brief; confirms the Shot List Generator flow end to end.
- Loom "New Winning Content Hub, Creator Access" (~3.5 min) — the earlier walkthrough from when the hub was behind a shared password; the best record of what a Creator Hub video entry contains, in the team's own terminology.
- `pixory-hub-reconstruction-spec.md` — direct observations of the live site, 19 Aug.
- Screenshots of the Shot List Generator.
- Weekly Blueprints, all in Notion.
- Creator Hub content brief in Notion: "NEW breakthrough hub (videos to brief)" — defines what a hub video entry contains.

---

## 2. Non-negotiable requirements

These exist because of how we lost the last one. Treat them as acceptance criteria, not nice-to-haves.

1. **We own the code.** `git init` and local commits from the first checkpoint. Pushed to a GitHub repo owned by Pixory before anything is shown to creators.
2. **We own the data.** Postgres we can dump. No proprietary store we cannot export.
3. **Automated backup.** A scheduled job dumps the database daily to off-platform storage, 30-day retention. Document the restore procedure in `docs/RESTORE.md` and perform a real restore once before launch.
4. **User-facing export.** Every creator can download their own shot lists as JSON/CSV. Admins can export everything.
5. **Nothing important lives only in the app.** Creator Hub video content is authored in a source we control (a seed file in the repo, and/or Notion) so the database is a cache, not the only copy.
6. **No hosting lock-in.** Standard Next.js, deployable anywhere.
7. **Migrations in the repo.** Versioned SQL migration files, not schema clicked into a dashboard.

---

## 3. Stack

- **Next.js** (App Router, TypeScript)
- **Supabase** — Postgres, storage if needed later
- **Vercel** — deploy from GitHub, preview deploys on PRs
- **Tailwind CSS**, with the tokens in §4 as CSS variables
- **Poppins** via `next/font`

Keep dependencies minimal. No component library — the design is simple and specific, and a library will fight the tokens.

**Sequencing note:** Supabase and Vercel are the destination, not the starting point. Do not set them up in the first checkpoints — they add setup friction and accounts and env vars before Emma has seen a single screen. Build against fixtures (§3.5), then wire the database once the screens are agreed.

---

## 3.5 Build so it can be seen and corrected

Three structural decisions that make the see-as-you-go loop work. Get these right at the start; retrofitting them is painful.

**1. One data layer, two implementations.**
All data access goes through a single module — `lib/data/index.ts` — exposing plain async functions (`getWeek`, `saveShot`, `getHubVideos`, `submitFlag`, …). Two implementations sit behind it:

- `lib/data/fixtures.ts` — in-memory data seeded from `fixtures/*.json`, mutable during a session so ticking a box and typing a note actually work on screen. Resets on reload.
- `lib/data/supabase.ts` — the real one, added later.

Switch with `DATA_SOURCE=fixtures|supabase` in `.env.local`, defaulting to `fixtures`. **No component may import Supabase directly.** This is what lets every screen be looked at and corrected before a database exists.

**2. Fixture data that looks like real life.**
Fixtures must be realistic, not `Lorem ipsum` or `Test Video 1`. Use the golden case in §12 for the shot list, and real Pixory material for the Creator Hub — actual hooks like "Fridge magnet → medium collection", real execution notes, real desired categories. Emma cannot judge a layout filled with placeholder text, and long real titles reveal layout problems that short fake ones hide.

Seed at least: 1 active week with the §12 shots (a few already ticked, so the progress bar and the crossing-out are visible), 2 archived previous weeks, 8 hub videos across different desired categories with a mix of completed and unfinished, 3 coaching flags in different states, and a handful of resources and workshops.

**3. A dev bypass, so nothing is behind a login.**
With `DEV_NO_AUTH=true`, the app treats the visitor as a seeded creator (and a `?as=coach` query param switches to a coach so the coach views can be seen too). No login screen appears. This is the default for the whole build until Checkpoint 8.

**Also:**
- Every checkpoint ends with a working `npm run dev` and no console errors. A checkpoint that only compiles is not done.
- Build mobile-first and tell Emma to check each screen at phone width too — narrow the browser or use device emulation. Most real use is on a phone, and this is where problems hide.
- Add a `/dev` page listing every route and every state worth looking at (empty state, loading, error, long-content) as direct links. It costs ten minutes and saves Emma hunting for the screen you want her to review.

---

## 4. Design system 🟢

Observed directly from the live app.

```css
--bg:            #FDFBF6;  /* warm cream page background */
--surface:       #FFFFFF;  /* cards */
--border:        #EFE9E0;  /* 1px warm card border */
--text:          #2A2724;  /* near-black warm charcoal */
--text-muted:    #7C7469;  /* secondary grey-brown */
--text-faint:    #A79E92;  /* placeholders, meta */
--accent:        #E8559B;  /* pink, primary accent */
--accent-light:  #F589B8;  /* gradient partner */
--accent-tint:   rgba(232,85,155,0.07);
```

- **Accent gradient** (progress bar, group number chips): `linear-gradient(135deg, #F589B8, #E8559B)`
- **Typography:** Poppins. Headings 700, `letter-spacing:-0.02em`. Body 400. Eyebrow labels 600, uppercase, `letter-spacing:0.12–0.14em`, in `--text-faint`.
- **Cards:** `background:var(--surface); border:1px solid var(--border); border-radius:18–22px; box-shadow:0 8px 22px rgba(42,39,36,0.06)`
- **Pills/tags:** rounded-full, tinted background, 600 weight, ~13px
- **Content width:** single centred column, max ~720px
- **Primary button:** dark charcoal fill, white text, rounded-full (`Log In →`, `Find my shots`)
- **Active nav item:** dark charcoal pill, white text
- **Group colour rotation** (tinted header row + number chip), cycling: pink, blue, grey, teal, pink, pink — soft ~8% tints on the cream background.
- **Dark mode:** a "Switch to dark mode" toggle existed. The dark palette was never captured 🔴 — build the toggle, derive a dark palette from the same tokens, have Emma check it.

Mobile-first. Everything must work one-handed on a phone: tap targets ≥44px, the sticky progress bar must not eat the viewport, inputs at `font-size:16px` minimum so iOS does not zoom.

---

## 5. Information architecture 🟢

| Nav label | Route | Confidence |
|---|---|---|
| Resource Hub | `/` | 🟡 partially known |
| Creator Hub | `/creator-hub` | 🟢 features known from Loom, entry structure from content brief |
| Coaching Flag | `/coaching-flag` | 🟢 known from Loom |
| Shot List | `/shot-list-generator` | 🟢 fully specified |

**Header** (all pages): "pixory" wordmark left → four nav items → search input, placeholder `Search videos & resources...` → light/dark toggle.

**Footer:** `Pixory Breakthrough Creator Resource Hub`
**Page `<title>`:** `Pixory Creator Community Resource Hub`

**Search** spans Creator Hub videos and Resource Hub resources. Original behaviour not captured 🔴. Build it as a single search over video title / hook / pillar / execution text plus resource titles, results grouped by type.

---

## 6. Auth 🟢

Deliberately low-friction. We are keeping it identical so nobody has to relearn it. The hub was previously behind a shared password; the login page replaced that.

**Sign Up / Log In** as two tabs on one card.

Log In panel copy, verbatim:
- Heading: `Welcome Back`
- Sub: `Enter your name and 4-digit PIN to continue.`
- Fields: first name, last name, 4-digit PIN (with show/hide eye icon)
- Button: `Log In →`
- Helper: `Use the same name and PIN you signed up with.`

**Sign Up flow** (from both Looms): a creator presses the new/sign-up tab, creates their profile with first and last name, and chooses a 4-digit PIN. Creators are told to save their PIN somewhere, and that a coach will *help them reset it* if they forget — reset is the correct implementation, since a hashed PIN cannot be retrieved.

Implementation notes:
- Identity is `first name + last name`, normalised (trimmed, case-insensitive). Enforce uniqueness on the normalised pair; on collision, say so rather than silently creating a duplicate. Note creators sometimes enter only an initial as the last name — accept it.
- **PIN must be hashed** (bcrypt/argon2). Never store or log it in plain text. Rate-limit to ~5 attempts per identity per 15 minutes so a 4-digit PIN is survivable.
- **Coach PIN reset is a required feature**, not an extra — creators have been told coaches can help them back in. Because PINs are hashed, coaches *set a new one* rather than retrieving the old one; make that wording clear in the admin UI.
- Session via httpOnly cookie, long-lived. Creators should not be logging in every week.
- Honest threat model: this protects shot lists and completion data, not payments. That is fine. Do not add anything heavier without asking.

---

## 7. Page specifications

### 7.1 Resource Hub — `/` 🟡

The landing page and orientation layer. Known from internal docs rather than observation — treat the layout as a proposal and confirm against the Loom.

**The Creator Content Journey** — three steps, framed as steps and *not* "buckets" (this framing is deliberate; creators found buckets confusing):
1. **Recreate from the hub** — start here, follow the execution guidance under each video exactly. Lean TOF early to build views and traction.
2. **Recreate from the Blueprint** — layer in the fresh weekly opportunities once comfortable. Newest hooks and visuals.
3. **Iterate on your own videos** — once you know what works for your account, iterate on your top performers using the iteration guide and the 5-in-5 framework.

**Workshops** 🟢 — a named section holding educational resources. Confirmed from the Loom: the explainer on desired categories lives *"inside of the resource hub under workshops"*, and Creator Hub video entries link to it. Treat Workshops as a real section, not a synonym for Resources.

**Resources** — the iteration guide, the 5-in-5 framework, execution/filming guidance, the FAQ. Each with title, short description, and a link or embedded video.

**Upcoming workshops and community calls** — with RSVP links, updated weekly. This was an explicit creator request.

**Direct links** to this week's Blueprint (Notion) and to the Shot List Generator.

Ask Emma for the full list of resources that were on this page before finalising 🔴.

### 7.2 Creator Hub — `/creator-hub` 🟢

The video library — proven content for creators to recreate. Replaces what the girls used to call the Winning Content Hub. Updated **biweekly** by the content team.

#### Video completion tracking (the headline feature)

From the Loom, verbatim intent: *"every video briefed here, you'll see a little circle and this is like a little check box… anytime that you tap that circle after you complete a video, just go ahead and tick this off. And that way you can keep track of what videos you've already completed."*

- Every video entry has a **circle checkbox**. Tapping it marks that video completed **for that creator**.
- **Tabs filter by state: `Completed` and `Unfinished`** (plus an all/default view). Erriel: *"under the completed tab, you can see all of the videos you've completed… and then on the unfinished tab, you can see the videos I need to tap into next."*
- Show counts — how many executed, how many left. This is the creator-facing purpose: organisation and knowing what to do next.
- **Coaches can see every creator's ticks.** Erriel: *"it gives us coaches visibility as well… we'll be able to see all of the videos that you check off… we'll also be able to see if there's any areas for improvement, and being consistent with this is going to help us continuously brief relevant content into this hub."* This is a real requirement, not a nice-to-have — completion data feeds the biweekly content decisions. See §10.

#### Ordering

**Order is meaningful.** Videos are deliberately sequenced so a creator working top to bottom lands on roughly a 60/40 TOF-to-product-desire mix. Display order must be editable by admins and must define each video's number — because the Shot List Generator pulls shots by video number.

#### Video entry fields 🟢

These are the team's own field names, taken from the Loom walkthrough. Use this terminology in the UI.

| Field | Notes |
|---|---|
| Number | Position in the ordered list |
| Title / caption | Usually the original post's caption |
| **Link to the original** | Opens the post on its platform (TikTok / Instagram / Facebook / YouTube) |
| **Embedded video** | The video is embedded and playable **inside the hub** — *"you actually don't have to go into a different platform, everything is right here for you."* Do not drop this; it is called out as a highlight. |
| **Hook variations** | A list of alternative text hooks. Purpose: *"many different combinations of testing a winning format with different text hook."* |
| **Format and emotional layers** | e.g. reaction type, emotional beat, pacing |
| **Desired category** | `Product Desire` · `Lifestyle Desire` · `Hybrid Desire` · `TOF` · `Pillar 3` — colour-coded chip. Link out to the desired-categories explainer in the Resource Hub under Workshops. |
| **Visual elements and element order** | The ordered list of visuals the video needs — **this is exactly what the Shot List Generator pulls by video number.** Order matters. |
| **Execution notes** | Specific and bulleted: expression, camera movement, ASMR loudness, when the beat drops, angles |
| Collection-size guidance | Small vs medium vs large collections execute differently — e.g. "quicker turn to books with longer expression → small collection" |
| **Audio suggestions** | Tappable — *"if you tap this, it'll take you to the audio directly on the platform"* — so store a label plus a URL per suggestion |
| Status | Active / retired |

Each entry is expandable to reveal all of the above. All execution guidance lives under the video — a deliberate choice by the team so no voice notes are needed.

**Display this rule alongside each video:** creators recreate the format identically to the original. The only things they may swap are the hook (for one of the hook variations) and the audio (for one of the audio suggestions).

**Also surface the balance reminder:** creators should keep a healthy mix of desired categories rather than only doing product desire or only hybrid.

⚠️ **The original video data is gone.** The next biweekly set must be re-entered by hand from the Notion content brief. **Build the admin UI early** so Emma's team can load content while the rest is still being built.

### 7.3 Coaching Flag — `/coaching-flag` 🟢

A creator support-request channel, introduced alongside completion tracking. Fully described in the Loom.

**What it is:** a text box where a creator tells the coaches what they are struggling with, what they need more support with, or asks specific questions. Erriel's framing: *"maybe you're feeling overwhelmed with resources, you don't know what's going on"* — that counts. Anything goes in.

**Rules and promises — both must be surfaced in the UI:**
- **One flag per creator every two weeks.** Rationale, from the Loom: it makes sure coaches can get to everybody. Enforce server-side; when a creator is inside the window, show them when they can flag again and what they submitted last time.
- **Coaches respond within 48 hours of submission.** State this on the form and on the confirmation state. It was promised out loud to the whole community, so the coach-side inbox must make the clock visible (§10).

**Purpose beyond individual support:** flags let coaches tailor resources and strategy for the week, and feed the biweekly briefing decisions alongside completion data.

**Creator-facing page:**
- Short intro explaining what the flag is for
- One textarea, generous size, no character-count anxiety
- Submit button
- After submitting: confirmation showing submitted time, the 48-hour promise, and when the next flag unlocks
- History of their own past flags with any coach response attached

### 7.4 Shot List Generator — `/shot-list-generator` 🟢

The most-used and most fully specified page. Build it first and get it exactly right.

**Purpose statement, verbatim, under the page title:**
> Groups your shots by physical setup, so you film everything that needs the same setup back-to-back instead of one video at a time.

#### Sticky progress card
Pinned to the top of the viewport while scrolling.
- Left: `Filming progress`
- Right: `{filmed} / {total} shots`
- Pink gradient fill bar, animating on change

#### Step 1 — `Get your shots in`
Sub: `Use the Creator Hub, the Blueprint, or both.`
Collapsible (chevron) — creators collapse it once shots are loaded so it is out of the way while filming. Collapse state persists.

**A. `PULL VIDEOS FROM THE CREATOR HUB`**
- Input placeholder: `Video numbers, e.g. 1, 2, 5`
- Button: `Get shots`
- Helper: `Pulls live from the Creator Hub videos. Enter the video numbers you want to batch.`
- Parses a comma/space separated list, fetches those videos' shot lists, tags each resulting shot `Video 1`, `Video 3`, etc.

**B. `OR PASTE A BLUEPRINT`**
- Textarea, two-line placeholder:
  `Open this week's Blueprint, select the whole page, copy, and paste it here.`
  `Don't worry about tidying it up first.`
- Buttons: `Find my shots` (primary) · `Example` · `Start over`
- `Example` loads a canned demo so a creator can see the output before pasting anything. Keep it — it is how people learn the tool.

**Result summary** — dynamic sentence with bolded numbers, exactly this shape:
> Found **{n} Blueprint opportunities** with {m} shots between them. That's only **{k} visuals** to film, in **{g} setups**.
> {r} shot is needed more than once. Film it first.

(Second line only when a shot is shared across opportunities. Pluralise: "1 shot is" / "2 shots are".)

**`VIDEOS INCLUDED`** — a summary list of everything that was pulled, with titles. **Both input paths feed one list in the same week**, and both appear here together: Blueprint opportunities (`Opportunity 1, 2, 3`) alongside Creator Hub videos (`Videos 1–5`). Its purpose, stated in the Loom, is verification — *"it's always good to double check to make sure that it is pulling the right videos"* — so make it easy to scan and to correct.

#### Step 2 — `Film one group at a time`
Sub: `Similar shots are grouped so you set up once. Fill in your variations, then work down.`

**Group header row:** coloured number chip · group name · right-aligned `{n} clips`

Group names describe a *physical setup*, not a video. Real examples:
`Turning to book stack` · `Flicking through pages` · `Paper tear and wrapping` · `Pushing and pulling` · `Shelf and stack` · `Close ups and detail`

**Shot card:**
- Round checkbox — ticking marks it filmed, **visibly crosses the shot out** (strikethrough on the title, card dimmed), and advances the progress bar. From the Loom: *"as you film each visual, you can click over here to make sure that it crosses everything out."* The crossing-out is the satisfying part — do not reduce it to a quiet state change.
- **Editable title**, placeholder `What's the visual?` — free text, renameable inline
- One or more source tags (`Opportunity 1`, `Opportunity 3`, `Video 1`) — a shot needed by several opportunities carries several tags and is filmed once
- `×` — delete the shot
- **Variation notes**, placeholder `location, outfit, reaction…` — free text. Real entries looked like `(1) Kitchen; Red Shirt AND (2) Kitchen; Blue Shirt`
- `move to another group` — reassign to a different setup group

**Footer controls:**
- `+ add a shot` — appends a blank user-created shot
- `{filmed} of {total} shots filmed`
- `Saved {HH:MM}` — last-saved timestamp
- `Start a new week` — archives the current week and starts fresh. **Requires a confirmation step** — from the Loom: *"say start a new week and click yes to archive and start afresh."* Never archive on a single tap.
- `Previous weeks ({n})` — expandable archive. Creators use it to look back at what they have filmed before, so archived weeks must retain their ticked/filmed state.

**Autosave:** debounced (~800ms) on every edit, plus on blur. Optimistic UI. Must survive a phone locking mid-session and must sync across devices for the same account — this was actively promoted to creators ("plan on your laptop, tick off on your phone").

#### `What counts as a variation?` explainer panel
> Anything you can change without setting up again.

Chips: `Location` `Outfit` `Reaction` `Angle` `Lighting` `Speed`

Worked example, verbatim:
> Living room · white top · teary
> Kitchen · black top · smiling
>
> Same shot. Two clips that feel like different days.
>
> Fill these in before you film.

---

## 8. The two hard parts

Everything else is CRUD and styling. These two are where the original app's value lived, and where you should expect to iterate with Emma.

### 8.1 Blueprint parser

**Input:** the entire text of a Notion Blueprint page, copy-pasted, untidied. Structure varies week to week. Blueprints contain opportunities, each with hooks, visuals/B-roll shot lists, execution notes, and a lot of surrounding prose.

**Output:** opportunities (index + title), each with a list of shot descriptions.

**Approach:**
1. A deterministic pre-pass that strips obvious noise and splits on opportunity boundaries (headings, "Opportunity N", numbered sections).
2. An LLM call with a strict JSON schema extracting `{opportunities:[{index,title,shots:[string]}]}`. This is the right tool for messy human input and is almost certainly how the original worked.
3. Cache by hash of the pasted text so re-pasting is free.
4. **Always show the creator what was found and let them edit, add and delete.** The parser is allowed to be imperfect because the output is editable — design around that rather than chasing perfection.

Pull sample Blueprints from Notion (search "Breakthrough Creator Recreation Blueprint") and build a fixture set of at least 6 real weeks. Those are your regression tests.

### 8.2 Setup grouping

**Input:** a flat list of shot descriptions from one or more opportunities.
**Output:** shots clustered by the physical setup they require, each cluster given a short human name, plus de-duplication of shots needed more than once.

**De-duplication:** shots that are the same visual across different opportunities collapse into one shot carrying multiple tags. This is what turns "9 shots" into "8 visuals". Near-duplicates matter: "side profile reaction turning to book stack" and "Avatar hug turning to book stack" are *not* the same shot but *do* share a setup.

**Clustering:** group by what you physically have to set up — props, location, arrangement — not by emotion or framing. `Turning to book stack` covers several different reactions because the book stack is the setup. Names should be short and plain: 2–4 words, sentence case.

**Approach:** LLM classification with a strict schema, given the whole shot list at once so it can see overlaps, returning `{groups:[{name,shotIndexes:[]}],duplicates:[[indexes]]}`. Seed with a few-shot prompt built from the golden case in §12 — a known-good input/output pair. Persist results; never silently re-cluster under a creator who is mid-week; always let `move to another group` override the machine.

Keep both behind one server module with a clean interface so the implementation can change without touching UI:

```ts
parseBlueprint(text: string): Promise<ParsedBlueprint>
groupShots(shots: ShotInput[]): Promise<GroupedShots>
```

---

## 9. Data model

```sql
creators (
  id uuid pk, first_name text, last_name text,
  name_key text unique,            -- normalised "emma|m"
  pin_hash text,
  role text default 'creator',     -- 'creator' | 'coach' | 'admin'
  created_at timestamptz, last_seen_at timestamptz
)

-- Shot List Generator
weeks (
  id uuid pk, creator_id uuid fk,
  label text, source_text text,    -- pasted Blueprint kept for reparsing
  created_at timestamptz, archived_at timestamptz null
)
opportunities (
  id uuid pk, week_id uuid fk, index int, title text,
  source text check (source in ('blueprint','creator_hub'))
)
shot_groups (
  id uuid pk, week_id uuid fk, position int, name text, colour_index int
)
shots (
  id uuid pk, week_id uuid fk, group_id uuid fk, position int,
  title text, variation_notes text,
  filmed bool default false, filmed_at timestamptz null,
  is_custom bool default false
)
shot_opportunities ( shot_id uuid fk, opportunity_id uuid fk )

-- Creator Hub
hub_videos (
  id uuid pk, position int,          -- defines the creator-facing number
  title text,
  original_url text,                 -- link to the post on its platform
  embed_url text,                    -- playable embed inside the hub
  desired_category text,             -- Product Desire | Lifestyle Desire | Hybrid Desire | TOF | Pillar 3
  hook_variations jsonb,             -- [ "text hook", ... ]
  format_layers text,                -- "format and emotional layers"
  visual_elements jsonb,             -- ORDERED [ "visual", ... ]  <- generator pulls this
  execution_notes text,
  collection_guidance text,
  audio_suggestions jsonb,           -- [ { label, url }, ... ]
  status text default 'active', updated_at timestamptz
)
video_completions (
  creator_id uuid fk, video_id uuid fk,
  completed_at timestamptz,
  primary key (creator_id, video_id)
)

-- Coaching Flag
coaching_flags (
  id uuid pk, creator_id uuid fk,
  body text, submitted_at timestamptz,
  responded_at timestamptz null, responded_by uuid null,
  response text null,
  status text default 'open'       -- 'open' | 'answered' | 'closed'
)

-- Resource Hub
resources ( id uuid pk, section text, position int, title text,
            description text, url text, kind text )
events_calendar ( id uuid pk, title text, starts_at timestamptz, rsvp_url text )
```

Week progress = `count(shots where filmed) / count(shots)`.

**Coaching flag eligibility:** a creator may submit if no flag exists with `submitted_at > now() - interval '14 days'`. Enforce in the database (constraint or a checked RPC), not only in the UI.

**Row-level security:** a creator reads and writes only their own `weeks`, `shots`, `shot_groups`, `opportunities`, `video_completions` and `coaching_flags`. `hub_videos`, `resources`, `events_calendar` readable by any signed-in creator, writable by admins. Coaches can read all `video_completions` and all `coaching_flags`, and write flag responses.

---

## 10. Coach and admin tools

Not an afterthought — the Loom promised creators that coaches are watching the ticks and answering flags in 48 hours.

**Coach dashboard**
- Per-creator completion view: who has ticked what, how many videos executed, how long since their last tick. Erriel uses this to spot areas for improvement and to decide what to brief next.
- Aggregate view: which videos the community is and is not executing — directly feeds the biweekly content update.
- **Coaching flag inbox:** open flags oldest-first, with time-since-submission prominent and anything approaching 48 hours highlighted. Reply inline; replying marks the flag answered and shows the response to the creator.

**Admin (`/admin`, behind role)**
- `hub_videos`: create, edit, **drag to reorder** (position drives the number), retire
- `resources` and `events_calendar`
- Reset a creator's PIN (set a new one; explain that the old cannot be retrieved)
- Export everything as JSON
- Import `hub_videos` from a checked-in seed JSON file

---

## 11. Acceptance criteria

**Data safety**
- [ ] Repo on GitHub, deploying to Vercel from `main`
- [ ] Daily automated database dump off-platform, 30-day retention
- [ ] `docs/RESTORE.md` written, and a restore performed successfully once on a scratch project
- [ ] A creator can export their own data from the UI
- [ ] `hub_videos` content exists as a seed file in the repo, not only in the database

**Shot List Generator**
- [ ] Pasting a real Blueprint produces opportunities and shots without manual tidying
- [ ] Shots grouped by physical setup, groups have short readable names
- [ ] A shot needed by two opportunities appears once with two tags, and the "film it first" line shows
- [ ] Blueprint paste and Creator Hub video numbers can be used together in one week, and both appear in `VIDEOS INCLUDED`
- [ ] Every shot can be renamed, given variation notes, ticked, deleted, moved between groups
- [ ] Ticking a shot visibly crosses it out
- [ ] `+ add a shot` works
- [ ] Progress bar sticks to the top and is accurate
- [ ] Autosave with visible `Saved HH:MM`; edits on a laptop appear on a phone for the same account
- [ ] `Start a new week` asks for confirmation before archiving; `Previous weeks (n)` lists archived weeks with their filmed state intact
- [ ] `Example` loads the golden case from §12
- [ ] Step 1 collapses
- [ ] Works one-handed on a phone

**Creator Hub**
- [ ] Every video has a tick circle; ticking persists per creator
- [ ] `Completed` and `Unfinished` tabs filter correctly, with counts
- [ ] Videos display in admin-defined order, and the displayed number matches what `Get shots` accepts
- [ ] Each video plays embedded in the hub, and links out to the original
- [ ] Hook variations and audio suggestions are listed, and audio suggestions link out to the platform
- [ ] `visual_elements` order is preserved and is what `Get shots` returns
- [ ] A coach can see any creator's completions, and an aggregate across the community
- [ ] Admin can add, edit, reorder and retire videos with no developer involvement

**Coaching Flag**
- [ ] A creator can submit one flag, then is blocked for 14 days with a clear "next flag available on…" state
- [ ] The 48-hour response promise is stated on the form and the confirmation
- [ ] Coach inbox shows time-since-submission and highlights flags nearing 48 hours
- [ ] A coach reply is visible to the creator in their flag history

**Shell**
- [ ] Four nav routes, active state, dark mode toggle
- [ ] Search returns videos and resources
- [ ] Name + PIN sign-up and log-in; PIN hashed; attempts rate-limited; coach can set a new PIN
- [ ] Copy matches this brief verbatim
- [ ] Lighthouse mobile performance ≥ 90

---

## 12. Golden test case 🟢

Real output from the original app. Use as the `Example` fixture, the few-shot seed for grouping, and a regression test.

**Input:** 3 Blueprint opportunities
1. `side profile reaction turning to book stack (solo)`
2. `Avatar hug turning to book stack`
3. `Did you fulfil your dreams?`

**Expected summary:**
> Found **3 Blueprint opportunities** with 9 shots between them. That's only **8 visuals** to film, in **6 setups**.
> 1 shot is needed more than once. Film it first.

**Expected groups:**

| # | Group | Clips | Shots |
|---|---|---|---|
| 1 | Turning to book stack | 2 | `Side profile reaction turning to book stack` (Opp 1 + Opp 3) · `Avatar hug turning to the book stack` (Opp 2) |
| 2 | Flicking through pages | 1 | `Flicking through the pages` (Opp 1) |
| 3 | Paper tear and wrapping | 2 | (Opp 1) · (Opp 2) |
| 4 | Pushing and pulling | 1 | (Opp 3) |
| 5 | Shelf and stack | 1 | `Stop motion on the shelf` (Opp 3) |
| 6 | Close ups and detail | 1 | `Close up of the cover` (Opp 2) |

Note the shared shot in group 1 — one visual serving Opportunities 1 and 3 — which produces "8 visuals" from 9 shots and triggers the "film it first" line.

---

## 13. Checkpoints

Fourteen checkpoints. **One at a time. Stop at the end of each and wait for Emma.**

Each checkpoint below states what to build, what to tell her to open, and what to ask her to look at. Checkpoints 1–7 are pure UI on fixtures — no database, no login — so she can see and correct almost the entire app before any plumbing exists.

---

### CP1 — Skeleton and brand
Scaffold Next.js + TypeScript + Tailwind. Design tokens from §4 as CSS variables. Poppins. Header with wordmark, four nav items, search input, dark mode toggle. Footer. Four empty routes. The `/dev` index page.

→ **Open `localhost:3000`.** Does the cream, the pink, the type and the rounded cards feel like Pixory? Is the nav in the right order with the right labels? Try the dark toggle, and narrow the browser to phone width.

### CP2 — Shot List Generator, static
The whole page rendered from the §12 fixture, exactly as specified in §7.4: sticky progress card, Step 1 with both inputs, the result summary sentence, `VIDEOS INCLUDED`, Step 2 with six coloured groups and all shot cards, the variation explainer panel, footer controls. Nothing is interactive yet.

→ **Open `/shot-list-generator`.** This is the most important screen in the app. Does it look like the one the girls have been using? Group colours, spacing, the wording of the summary sentence, the placeholder text.

### CP3 — Shot List Generator, interactive
Tick a shot (crossing out, progress bar moves), rename a shot inline, type variation notes, delete a shot, `move to another group`, `+ add a shot`, collapse Step 1, `Saved HH:MM` updating. All against fixtures, so state resets on reload — that is fine and expected.

→ **Open `/shot-list-generator` and use it as a creator would.** Tick things. Rename something. Add a shot. Does the crossing-out feel good? Does anything feel awkward with your thumb on a phone?

### CP4 — Previous weeks and starting a new week
`Start a new week` with its confirmation step, `Previous weeks (2)` expanding to the archived fixtures with filmed state intact.

→ **Open `/shot-list-generator`, scroll to the bottom.** Is the confirmation clear enough that nobody archives by accident? Is the archive view useful, or does it need more?

### CP5 — Creator Hub
Ordered video list from fixtures, each entry with its number and desired-category chip, expanding to show the embed, hook variations, format and emotional layers, visual elements in order, execution notes, audio suggestions, collection guidance. Tick circles. Completed / Unfinished tabs with counts. The recreate-identically rule and the category-balance reminder.

→ **Open `/creator-hub`.** Is a video entry laid out the way it was? Is anything missing from an entry? Do the tabs behave the way you remember?

### CP6 — Coaching Flag
Creator-facing form, the 48-hour promise, submitted confirmation, the blocked state showing when the next flag unlocks, and the creator's own flag history with responses.

→ **Open `/coaching-flag`, then `/dev` to see the blocked and answered states.** Does the wording sound like you? Is the 48-hour promise prominent enough?

### CP7 — Resource Hub
Content journey (three steps, not buckets), Workshops section, Resources, workshops and calls calendar with RSVP links, links to the Blueprint and the Shot List Generator.

→ **Open `/`.** This is the page I know least about — tell me what is wrong, missing or in the wrong order.

**At this point Emma has seen the entire creator-facing app.** Everything after this is making it real.

---

### CP8 — Database and auth
Supabase project, migrations for §9, swap the data layer to `supabase`, seed from fixtures so the screens look identical. Then sign-up and log-in with name + PIN, hashed and rate-limited, roles, and the coach PIN reset. Keep `DEV_NO_AUTH` available.

→ **Sign up as yourself, log out, log back in.** Then confirm every screen still looks the way it did on fixtures — if anything shifted, that is a bug.

### CP9 — Real saving
Autosave wired to the database. Ticks, renames, variation notes, new weeks and archives all persist.

→ **Tick some shots on your laptop, then open the same page on your phone and log in.** Your ticks should be there. This is the cross-device promise you made to the girls.

### CP10 — Blueprint parser
`parseBlueprint` per §8.1, with the fixture set of at least 6 real Blueprints, and an editable review step after parsing.

→ **Paste this week's real Blueprint in.** Did it find the right opportunities and shots? Where did it get confused? Paste an old one too — we need it to work on messy weeks, not just tidy ones.

### CP11 — Setup grouping
`groupShots` per §8.2, with de-duplication, the "film it first" flag, and group naming. §12 must reproduce exactly.

→ **Paste the same Blueprint again.** Are the groups genuinely grouped by *setup*? Are the names ones you would have written? Is the duplicate detection catching the right things?

### CP12 — Creator Hub admin
Admin route: create, edit, drag-reorder and retire videos; manage resources and workshops; seed import/export; PIN reset.

→ **Add a real video from the next hub update.** Can you do it without me? Can Erriel? That is the bar.

### CP13 — Coach views
Per-creator completion view, community aggregate, coaching flag inbox with time-since-submission and 48-hour highlighting, inline replies.

→ **Open `/admin` as a coach.** Does this tell you what you actually need to know for the biweekly briefing decision?

### CP14 — Ship it properly
Push to GitHub. Vercel deploy from `main`. Daily database backup to off-platform storage. `docs/RESTORE.md`, and a real restore tested on a scratch project. Creator data export. Hub videos exported to a checked-in seed file. Then search across videos and resources.

→ **This is the checkpoint that means it never happens again.** Do not call the project done before the restore has actually been tested.

---

**Shortcut if the girls need something this week:** CP1 → CP2 → CP3 → CP8 → CP9 → CP10 → CP11 gets a working Shot List Generator live on its own. The Creator Hub, Coaching Flag and Resource Hub can follow. Say the word and I will sequence it that way.

---

## 14. Out of scope for v1

Do not build without asking: email notifications, analytics dashboards beyond the coach views above, multi-community support, creator-to-creator sharing, mobile apps, AI shot suggestions beyond parsing and grouping, image or video uploads.

---

## 15. Open questions for Emma 🔴

Answer these before the milestones that depend on them.

1. **Resource Hub** — beyond the Workshops section, what else was on the landing page? Full list of resources, guides and links.
2. **Visual elements per hub video** — where do these come from now the data is gone? Are they recorded in Notion, or do they need writing from scratch for each video?
3. **Previous weeks** — read-only, or could a creator reopen and continue an archived week?
4. **Search** — did it cover video content, resource titles, or both, and how were results shown?
5. **Dark mode** — was it actually used, and does the palette matter?
6. **Coaching flag responses** — did coaches reply inside the hub, or out in Discord/DMs? (Affects whether the reply field is needed in v1.)
7. **Video completion** — does "completed" mean filmed, or posted? The tick's meaning should match how coaches read the data.
8. **Roles** — who are the coaches, and should coach and admin be separate permissions?

---

## Kickoff prompt

Paste this into Claude Code:

```
Read docs/BRIEF.md in full before writing any code. Pay particular
attention to §0 (how we work) and §3.5 (build so it can be seen) —
I want to see and correct each piece as you build it, so you must
stop at every checkpoint and wait for me.

Do CP1 only:
- git init, first commit
- Scaffold Next.js + TypeScript + Tailwind
- Design tokens from §4 as CSS variables, Poppins via next/font
- Header (wordmark, four nav items with the verbatim labels from §5,
  search input, dark mode toggle) and footer
- The four routes as empty pages
- The /dev index page listing every route
- Set up the data layer structure from §3.5 with a fixtures
  implementation, even though there is no data to serve yet

Do NOT set up Supabase, Vercel or auth yet.

Then start the dev server, confirm there are no console errors,
tell me what to open and what to look at, and STOP. Do not start CP2.
```

Then, at each checkpoint, either give feedback or say "looks good, next checkpoint".
