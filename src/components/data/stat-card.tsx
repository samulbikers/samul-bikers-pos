import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  title,
  value,
  change,
  note,
  color,
  trend = "up",
  footer,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  change?: string;
  note: string;
  color: string;
  trend?: "up" | "down" | "flat";
  footer?: React.ReactNode;
}) {
  return (
    <article className="rise-in min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium text-muted-foreground">{title}</span>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"
          style={{ color }}
        >
          <Icon aria-hidden="true" className="size-[15px]" />
        </span>
      </div>
      <p className="mt-4 truncate font-display text-[23px] font-semibold text-foreground sm:text-[25px]" title={value}>
        {value}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold ${
              trend === "down" ? "text-destructive" : "text-emerald"
            }`}
          >
            {trend === "down" ? (
              <ArrowDownRight aria-hidden="true" className="size-3" />
            ) : (
              <ArrowUpRight aria-hidden="true" className="size-3" />
            )}
            {change}
          </span>
        )}
        {note}
      </p>
      {footer}
    </article>
  );
}
