// Shared types for the data layer — mirrors the schema in §9 of docs/BRIEF.md.
// Both lib/data/fixtures.ts and lib/data/supabase.ts implement these shapes.

export type Role = "creator" | "coach" | "admin";

export interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface Shot {
  id: string;
  weekId: string;
  groupId: string;
  position: number;
  title: string;
  variationNotes: string;
  filmed: boolean;
  filmedAt: string | null;
  isCustom: boolean;
  opportunityTags: string[]; // e.g. ["Opportunity 1", "Video 3"]
}

export interface ShotGroup {
  id: string;
  weekId: string;
  position: number;
  name: string;
  colourIndex: number;
}

export interface Opportunity {
  id: string;
  weekId: string;
  index: number;
  title: string;
  source: "blueprint" | "creator_hub";
}

export interface Week {
  id: string;
  creatorId: string;
  label: string;
  sourceText: string | null;
  createdAt: string;
  archivedAt: string | null;
  groups: ShotGroup[];
  shots: Shot[];
  opportunities: Opportunity[];
}

export type DesiredCategory =
  | "Product Desire"
  | "Lifestyle Desire"
  | "Hybrid Desire"
  | "TOF"
  | "Pillar 3";

export const DESIRED_CATEGORIES: DesiredCategory[] = [
  "Product Desire",
  "Lifestyle Desire",
  "Hybrid Desire",
  "TOF",
  "Pillar 3",
];

export interface AudioSuggestion {
  label: string;
  url: string;
}

export interface HubVideo {
  id: string;
  position: number; // defines the creator-facing number
  title: string;
  creatorName: string; // "by {name}" attribution, confirmed from the Loom walkthrough
  originalUrl: string;
  embedUrl: string;
  desiredCategory: DesiredCategory;
  hookVariations: string[];
  formatLayers: string;
  visualElements: string[]; // ordered — the Shot List Generator pulls this
  executionNotes: string;
  collectionGuidance: string;
  audioSuggestions: AudioSuggestion[];
  status: "active" | "retired";
  updatedAt: string;
}

export interface VideoCompletion {
  creatorId: string;
  videoId: string;
  completedAt: string;
}

// The preset "what's going on" checklist — confirmed from the Loom walkthrough.
// The brief guessed a free-text box; the real screen is this checklist plus
// one optional free-text field.
export const COACHING_FLAG_OPTIONS = [
  { id: "stuck-visuals", emoji: "🎯", label: "I feel stuck with visuals" },
  { id: "stuck-hooks", emoji: "📝", label: "I feel stuck with text hooks" },
  { id: "struggling-film", emoji: "🎥", label: "I'm struggling to film" },
  { id: "struggling-consistent", emoji: "📅", label: "I'm struggling to stay consistent" },
  { id: "overwhelmed", emoji: "⚡", label: "Overwhelmed with resources / prioritisation" },
  { id: "speak-personally", emoji: "🗣️", label: "I'd like to speak to someone personally" },
  { id: "not-feeling-well", emoji: "💙", label: "I'm not feeling well personally" },
] as const;

export type CoachingFlagOptionId = (typeof COACHING_FLAG_OPTIONS)[number]["id"];

export interface CoachingFlag {
  id: string;
  creatorId: string;
  selectedOptions: CoachingFlagOptionId[];
  note: string; // "Anything else you'd like to share? (optional)"
  submittedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  response: string | null;
  status: "open" | "answered" | "closed";
}

export interface ResourceLink {
  label: string; // e.g. "Watch video", "Canva template", "Open guide"
  url: string;
}

export interface Resource {
  id: string;
  section: string; // "resources" | "workshops" | admin can add more sections later
  position: number;
  title: string;
  description: string;
  thumbnailUrl: string; // "" = show a generated placeholder tile
  links: ResourceLink[]; // flexible — a resource can carry a video link, a Canva link, etc. together
}

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  rsvpUrl: string;
}
