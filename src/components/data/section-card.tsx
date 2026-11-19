import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  footer,
  children,
  className = "",
  bodyClassName = "px-4 pb-4 sm:px-5 sm:pb-5",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`min-w-0 rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)] ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-card-foreground">{title}</h3>
          {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={`pt-2 ${bodyClassName}`}>{children}</div>
      {footer && <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">{footer}</div>}
    </section>
  );
}
