import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = "Nothing to show yet.",
  minWidth = "640px",
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  minWidth?: string;
  caption?: string;
}) {
  return (
    <div className="dashboard-table-scroller overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-y border-border bg-muted/50 text-[10px] font-medium text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-[9px] first:pl-5 last:pr-5 ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-border/80 last:border-0 hover:bg-muted/40">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 text-[11px] text-card-foreground first:pl-5 last:pr-5 ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-9 text-center text-[11px] text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
