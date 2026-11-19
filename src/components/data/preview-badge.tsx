export function PreviewBadge({ label = "PREVIEW · SAMPLE DATA" }: { label?: string }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-amber/20 bg-amber/10 px-2 text-[10px] font-semibold text-amber">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-amber" />
      {label}
    </span>
  );
}
