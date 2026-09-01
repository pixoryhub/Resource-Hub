import type { ShotGroup, Shot } from "@/lib/data/types";
import ShotCard from "./ShotCard";

export default function GroupCard({
  group,
  index,
  shots,
}: {
  group: ShotGroup;
  index: number;
  shots: Shot[];
}) {
  const colour = group.colourIndex % 4;

  return (
    <section className="overflow-hidden rounded-[20px] border border-border">
      <div
        className="flex items-center gap-3 px-4 py-3 sm:px-5"
        style={{ background: `var(--group-tint-${colour})` }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `var(--group-color-${colour})` }}
        >
          {index}
        </span>
        <h3 className="flex-1 font-bold text-text">{group.name}</h3>
        <span className="shrink-0 text-sm text-text-muted">
          {shots.length} {shots.length === 1 ? "clip" : "clips"}
        </span>
      </div>

      <div className="space-y-2 bg-bg p-2 sm:p-3">
        {shots.map((shot) => (
          <ShotCard key={shot.id} shot={shot} />
        ))}
      </div>
    </section>
  );
}
