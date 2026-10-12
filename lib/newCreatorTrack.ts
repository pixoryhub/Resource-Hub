// New creator track — instead of working from a separate Notion doc, a new
// creator picks a handful of Creator Hub videos and recreates each one
// several times, linking every recreation as they go. Stored per creator
// under "new-creator-track"; the links themselves are the same
// "recreation-links" entries every hub video already uses (keyed by video
// id), so a creator never submits the same link in two places and the
// admin recreation-links panel already sees them.
//
// Types/constants only — safe to import from client components. The
// server-side loader lives in lib/newCreatorTrackServer.ts.

import type { DesiredCategory, HubVideo, TrackGuide, TrackMix, TrackStepKey } from "@/lib/data/types";

export const TRACK_MAX_VIDEOS = 6;
export const TRACK_RECREATIONS_PER_VIDEO = 5;

// What new creators are reminded of on their track unless a coach edits it
// in the admin dashboard (stored as trackNote in site settings).
export const DEFAULT_TRACK_NOTE =
  "Keep it varied: don't post the same video — or the same text hook — back to back. Mix up your videos and your hooks as you go.";

// Milestones — a creator's total linked recreations across their picked
// videos. Hitting the first earns a strategic audit, the second a Success
// Coach audit; coaches tick them off in admin.
export const AUDIT_1_AT = 15;
export const AUDIT_2_AT = 25;

export function nextAudit(totalLinks: number): { remaining: number; label: string } | null {
  if (totalLinks < AUDIT_1_AT) return { remaining: AUDIT_1_AT - totalLinks, label: "your first audit" };
  if (totalLinks < AUDIT_2_AT) return { remaining: AUDIT_2_AT - totalLinks, label: "your second audit" };
  return null;
}

// The recreation guide — the instructions that used to live in the Notion
// blueprint. These are the built-in defaults; coaches edit any part in the
// admin dashboard (stored as trackGuide in site settings).
export const STEP_KEYS: TrackStepKey[] = ["getReady", "film", "post15", "audit1", "refilmPost10", "audit2", "plan"];

export const DEFAULT_TRACK_GUIDE: TrackGuide = {
  checklist: [
    "I've received all 15 of my Pixory books (10 blank + 5 personalised)",
    "I've joined the Pixory Discord and can access the #breakthrough channel",
    "I've created both my Instagram and TikTok accounts",
    "I've added my Welcome Call Strategist and Success Coach as friends on Discord",
    "I've reviewed my 5 chosen videos in the hub",
    "I understand I need to recreate each of my 5 videos 5 times before Day 30",
    "I've reviewed the B-roll shot list and know exactly what clips I need to film",
    "I've set aside time in the next 1–2 days to complete my first filming block",
    "I understand the first audit will review my first 15 posts and give me feedback",
    "I understand the importance of jumping on the second audit + 1:1 Success Call",
    "I know how to reach my strategist if I get stuck or need support",
    "I've let my strategist know about any upcoming travel plans",
    "I've reviewed and understand all resources shared",
  ],
  steps: {
    getReady: {
      title: "Get ready",
      body: "Tick off the checklist below, then tap “I'm ready to start recreating” when you're set.",
    },
    film: {
      title: "Film your B-roll, then edit",
      body:
        "Film every clip on your shot list — that's the raw footage you'll use across all your recreations. Feel free to overfilm; you'll reuse it often.\n\nThen edit: match your B-roll to each video you chose, focusing on accurate angles, framing, timing and pacing. Don't post until your videos are edited. (About Days 1–3.)",
    },
    post15: {
      title: "Post your first 15",
      body:
        "Recreate each of your 5 videos 3 times and link every post as you go — about 3 posts a day. Your first audit comes at 15 posts. (About Days 4–8.)",
    },
    audit1: {
      title: "First strategic audit",
      body:
        "You've hit 15 posts! Your strategist is reviewing them to find what's landing (hooks, visuals, angles), what needs tightening (filming or edits) and any missing B-roll or extra shots. You'll get personalised feedback.",
    },
    refilmPost10: {
      title: "Re-film, then post your final 10",
      body:
        "Use your audit feedback to re-film the key visuals flagged — it makes your next posts sharper and more accurate.\n\nThen post your final 10 recreations, about 3 a day, to reach 25. (About Days 10–16.)",
    },
    audit2: {
      title: "Success Coach audit",
      body:
        "25 posts live! Your coach will review your top performing content, suggest further edits, visuals and tweaks, identify the traits that made it work, and build your next 15-day game plan unique to your style and strengths.",
    },
    plan: {
      title: "Your personalised posting plan",
      body:
        "Keep posting 2–3 times a day using the Scenario Blueprint built for you, so your content evolves, sharpens and starts scaling. This is where momentum builds.",
    },
  },
  tips:
    "Filming your B-roll\n• Film your humanised visuals with strong emotional execution and different outfits/hairstyles.\n• Film your core elements (stop motion, pushing books down, payoff) in multiple environments.\n• Use a tripod or stabilise your camera, especially for pushing books or stop motion.\n\nWhile you film\n• Emotional expression: make your reaction match the hook and feel specific, not generic.\n• Frame control: keep the photobooks (and yourself, for humanised expressions) as the focal point — remove distractions, empty space and clutter.\n• Smooth micro-actions: make small actions clean and intentional — one smooth rip, a stable camera turn, one confident placement.\n• Camera & eyeline: match your gaze and body to where the product is — slightly up for a camera turn to the book stack, slightly down for the fridge magnet.\n• Abundance & scale: use framing and stacking so it looks like you have an abundance of books.\n• Follow-through: complete the full sequence — don't stop early or skip steps.\n\nBecome your own content strategist (before each post)\n• Filming: can the lighting and framing be improved? Is it at a similar standard to the viral post? Are the angles intentional?\n• Editing: does the pacing match the reference? Are text overlays clean, in native TikTok fonts that match the reference? Is the audio from the original viral post? Does the sequence match the video you're recreating?",
  keywords:
    "travel gifts, photo album aesthetic, travel memories, pixory photobooks, birthday gift idea, cute gifts, digital scrapbook, aesthetic memories, aesthetic travel album, nostalgic gift, travel ideas, girl travel aesthetic, photo dump ideas, trip recap, USA, Europe, memories, travel, printedphotos, printedmemories, travelmemories, travelphotobooks, scrapbook, journaling",
};

// Coach edits override the defaults part by part, so a half-filled saved
// guide (or an older one missing a step) never leaves a blank section.
export function resolveGuide(saved: TrackGuide | null | undefined): TrackGuide {
  if (!saved) return DEFAULT_TRACK_GUIDE;
  const steps = { ...DEFAULT_TRACK_GUIDE.steps };
  for (const key of STEP_KEYS) {
    const step = saved.steps?.[key];
    if (step && (step.title.trim() || step.body.trim())) steps[key] = step;
  }
  return {
    checklist: saved.checklist?.length ? saved.checklist : DEFAULT_TRACK_GUIDE.checklist,
    steps,
    tips: saved.tips?.trim() ? saved.tips : DEFAULT_TRACK_GUIDE.tips,
    keywords: saved.keywords?.trim() ? saved.keywords : DEFAULT_TRACK_GUIDE.keywords,
  };
}

// Which stage a creator is at — one rule shared by their own guide and the
// admin dashboard, so they always agree.
export function computeStage(input: {
  readyAt: string | null;
  startedAt: string | null;
  totalLinks: number;
  firstAuditDone: boolean;
  secondAuditDone: boolean;
}): NewCreatorStage {
  if (!input.readyAt && !input.startedAt) return "not-ready";
  if (!input.startedAt) return "ready";
  if (input.totalLinks === 0) return "picked";
  if (input.totalLinks >= AUDIT_2_AT) return input.secondAuditDone ? "complete" : "audit2-due";
  if (input.totalLinks >= AUDIT_1_AT && !input.firstAuditDone) return "audit1-due";
  return "posting";
}

// The guide step a creator should be reading right now.
export function stepKeyFor(stage: NewCreatorStage, totalLinks: number): TrackStepKey {
  switch (stage) {
    case "not-ready":
    case "ready":
      return "getReady";
    case "picked":
      return "film";
    case "posting":
      return totalLinks >= AUDIT_1_AT ? "refilmPost10" : "post15";
    case "audit1-due":
      return "audit1";
    case "audit2-due":
      return "audit2";
    case "complete":
      return "plan";
  }
}

// This week's pick rule (see TrackMix in lib/data/types.ts) — which videos a
// new creator may choose from, and exactly how many per desired category.
export type MixKey = "product" | "lifestyle" | "hybrid";
export const MIX_KEYS: MixKey[] = ["hybrid", "lifestyle", "product"];
export const MIX_LABELS: Record<MixKey, string> = { hybrid: "Hybrid", lifestyle: "Lifestyle", product: "Product" };
const CATEGORY_TO_MIX: Record<DesiredCategory, MixKey> = {
  "Product Desire": "product",
  "Lifestyle Desire": "lifestyle",
  "Hybrid Desire": "hybrid",
};

export function mixKeyOf(video: { desiredCategory: DesiredCategory }): MixKey {
  return CATEGORY_TO_MIX[video.desiredCategory];
}

// Videos a creator can pick from under a mix: inside the shortlist (when
// one's set) and in a category the mix actually asks for.
export function offeredVideos(videos: HubVideo[], mix: TrackMix): HubVideo[] {
  return videos.filter(
    (v) => (mix.videoIds.length === 0 || mix.videoIds.includes(v.id)) && mix[mixKeyOf(v)] > 0
  );
}

// Per-category requirement, capped at what's actually on offer so a mix
// asking for more than exists can never become impossible to satisfy.
export function mixQuotas(mix: TrackMix, offered: HubVideo[]): Record<MixKey, number> {
  const available: Record<MixKey, number> = { hybrid: 0, lifestyle: 0, product: 0 };
  offered.forEach((v) => (available[mixKeyOf(v)] += 1));
  return {
    hybrid: Math.min(mix.hybrid, available.hybrid),
    lifestyle: Math.min(mix.lifestyle, available.lifestyle),
    product: Math.min(mix.product, available.product),
  };
}

export function pickCounts(videos: HubVideo[], pickedIds: string[]): Record<MixKey, number> {
  const counts: Record<MixKey, number> = { hybrid: 0, lifestyle: 0, product: 0 };
  videos.filter((v) => pickedIds.includes(v.id)).forEach((v) => (counts[mixKeyOf(v)] += 1));
  return counts;
}

// Stored per creator under "new-creator-track". readyAt is when they tapped
// "ready to start recreating"; startedAt is when they locked in their
// picks — null until they have.
export interface NewCreatorTrack {
  readyAt: string | null;
  startedAt: string | null;
  videoIds: string[];
}

// The pre-start checklist items a creator has ticked (by item text), under
// "new-creator-checklist".
export interface NewCreatorChecklist {
  ticked: string[];
}

// Written only by coaches (admin), under "new-creator-audits".
export interface NewCreatorAudits {
  first: string | null;
  second: string | null;
}

export type NewCreatorStage =
  | "not-ready"
  | "ready"
  | "picked"
  | "posting"
  | "audit1-due"
  | "audit2-due"
  | "complete";

export const STAGE_LABELS: Record<NewCreatorStage, string> = {
  "not-ready": "Hasn't clicked ready yet",
  ready: "Ready — hasn't picked videos",
  picked: "Picked videos — no posts yet",
  posting: "Posting",
  "audit1-due": "First audit due",
  "audit2-due": "Second audit due",
  complete: "Finished all 25",
};

export interface NewCreatorTrackSummary {
  stage: NewCreatorStage;
  readyAt: string | null;
  startedAt: string | null;
  firstLinkAt: string | null;
  lastLinkAt: string | null;
  videos: { id: string; position: number; title: string; linkCount: number }[];
  totalLinks: number;
  targetLinks: number;
  // When the creator's 15th / 25th link went in.
  milestoneAt: { first: string | null; second: string | null };
  auditsDone: NewCreatorAudits;
  checklist: { done: number; total: number };
}

// How many days a creator has been sitting at their current step without
// moving on — null if it's under 3 days (not worth flagging) or the step
// isn't one a creator can stall on (audits are the coach's court).
export const STUCK_AFTER_DAYS = 3;

export function stuckDays(
  summary: Pick<NewCreatorTrackSummary, "stage" | "readyAt" | "startedAt" | "lastLinkAt">,
  signedUpAt: string | null,
  now: number = Date.now()
): number | null {
  const since =
    summary.stage === "not-ready"
      ? signedUpAt
      : summary.stage === "ready"
        ? summary.readyAt
        : summary.stage === "picked"
          ? summary.startedAt
          : summary.stage === "posting"
            ? summary.lastLinkAt
            : null;
  if (!since) return null;
  const days = Math.floor((now - new Date(since).getTime()) / 86_400_000);
  return days >= STUCK_AFTER_DAYS ? days : null;
}
