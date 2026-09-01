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

export interface AudioSuggestion {
  label: string;
  url: string;
}

export interface HubVideo {
  id: string;
  position: number;
  title: string;
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

export interface CoachingFlag {
  id: string;
  creatorId: string;
  body: string;
  submittedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
  response: string | null;
  status: "open" | "answered" | "closed";
}

export interface Resource {
  id: string;
  section: string;
  position: number;
  title: string;
  description: string;
  url: string;
  kind: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  rsvpUrl: string;
}
