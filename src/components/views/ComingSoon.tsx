export function ComingSoon({
  title,
  sub,
  tagline,
}: {
  title: string;
  sub: string;
  tagline?: string;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
          {sub}
        </div>
        <h1 className="font-display text-4xl text-ink mb-4 tracking-tight">
          {title}
        </h1>
        <div className="h-px w-16 bg-rule-2 mx-auto mb-4" />
        {tagline && (
          <p className="text-sm text-ink-2 leading-relaxed">{tagline}</p>
        )}
      </div>
    </div>
  );
}
