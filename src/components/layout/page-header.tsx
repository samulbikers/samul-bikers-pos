import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section
      aria-label={`${title} header`}
      className="flex flex-wrap items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <h2 className="font-display text-[19px] font-semibold leading-tight text-foreground sm:text-[22px]">
          {title}
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </section>
  );
}
