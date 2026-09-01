import type { DesiredCategory } from "@/lib/data/types";
import { CATEGORY_COLOUR } from "@/lib/desiredCategory";

export default function CategoryChip({ category }: { category: DesiredCategory }) {
  const colour = CATEGORY_COLOUR[category];
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `var(--group-tint-${colour})`, color: `var(--group-color-${colour})` }}
    >
      {category}
    </span>
  );
}
