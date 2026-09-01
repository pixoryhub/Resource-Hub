import type { DesiredCategory } from "./data/types";

// Colour index into the --group-color-N / --group-tint-N tokens (globals.css).
export const CATEGORY_COLOUR: Record<DesiredCategory, number> = {
  "Product Desire": 0, // pink
  "Lifestyle Desire": 1, // blue
  TOF: 2, // grey
  "Hybrid Desire": 3, // teal
  "Pillar 3": 4, // amber
};
