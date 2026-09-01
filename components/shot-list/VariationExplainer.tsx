const CHIPS = ["Location", "Outfit", "Reaction", "Angle", "Lighting", "Speed"];

export default function VariationExplainer() {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-lg font-bold text-text">What counts as a variation?</h3>
      <p className="mt-1 text-text-muted">Anything you can change without setting up again.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold text-accent"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-bg p-4 text-sm text-text-muted">
        <p>Living room · white top · teary</p>
        <p>Kitchen · black top · smiling</p>
        <p className="mt-3 font-semibold text-text">Same shot. Two clips that feel like different days.</p>
        <p className="mt-3">Fill these in before you film.</p>
      </div>
    </section>
  );
}
