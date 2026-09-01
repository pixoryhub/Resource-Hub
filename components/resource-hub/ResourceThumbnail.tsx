// A pasted image URL renders as-is. With none, a colourful placeholder tile
// keeps the grid from looking flat — cycles through the same 5-colour
// rotation used elsewhere (globals.css --group-color-N).

export default function ResourceThumbnail({
  thumbnailUrl,
  title,
  colourIndex,
}: {
  thumbnailUrl: string;
  title: string;
  colourIndex: number;
}) {
  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- thumbnail URLs are arbitrary external links (Canva, Notion, etc.), not local/optimizable assets
      <img
        src={thumbnailUrl}
        alt=""
        className="h-32 w-full rounded-t-[19px] object-cover"
      />
    );
  }

  const colour = colourIndex % 5;
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className="flex h-32 w-full items-center justify-center rounded-t-[19px]"
      style={{ background: `var(--group-tint-${colour})` }}
      aria-hidden
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
        style={{ background: `var(--group-color-${colour})` }}
      >
        {initial}
      </span>
    </div>
  );
}
