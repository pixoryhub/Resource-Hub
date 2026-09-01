import type { DesiredCategory } from "@/lib/data/types";

// One muted, neutral style for every desired category — the per-category
// colour coding was more visual noise than signal (that's what the group
// colours in the Shot List Generator are for). Category still reads fine as
// text; it just doesn't need its own colour language.
export default function CategoryChip({ category }: { category: DesiredCategory }) {
  return (
    <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-semibold text-text-muted">
      {category}
    </span>
  );
}
