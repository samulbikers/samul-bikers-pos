import { ArrowDownLeft, ArrowUpRight, Boxes, ClipboardCheck, PackageSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sampleProducts, stockStatus } from "@/data/sample/catalog";
import { sampleStockMovements } from "@/data/sample/operations";
import { formatKes } from "@/lib/format";

const stockOptions = ["All stock levels", "In stock", "Low stock", "Out of stock"] as const;

export function InventoryPage() {
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<string>(stockOptions[0]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleProducts.filter((product) => {
      const matchesQuery = !needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle);
      const matchesStock = stock === stockOptions[0] || stockStatus(product) === stock;
      return matchesQuery && matchesStock;
    });
  }, [query, stock]);

  const stockValue = sampleProducts.reduce((sum, product) => sum + product.price * product.stock, 0);
  const unitsOnHand = sampleProducts.reduce((sum, product) => sum + product.stock, 0);
  const lowCount = sampleProducts.filter((product) => stockStatus(product) === "Low stock").length;
  const outCount = sampleProducts.filter((product) => stockStatus(product) === "Out of stock").length;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Track what is on the shelf, what needs reordering and how stock has moved."
        meta={<PreviewBadge />}
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.success("Stock count started", { description: "Sample count sheet created for the main branch." })}
          >
            <ClipboardCheck aria-hidden="true" className="size-3.5" />
            Record stock count
          </Button>
        }
      />

      <section aria-label="Inventory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Boxes} title="Units on hand" value={String(unitsOnHand)} note="across all categories" color="var(--chart-1)" />
        <StatCard icon={PackageSearch} title="Stock value" value={formatKes(stockValue)} note="retail valuation" color="var(--chart-2)" />
        <StatCard icon={ArrowDownLeft} title="Low stock" value={String(lowCount)} note="at or below reorder level" color="var(--chart-4)" />
        <StatCard icon={ArrowUpRight} title="Out of stock" value={String(outCount)} note="cannot be sold" color="var(--chart-5)" trend="down" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Stock levels</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Reorder alerts use each product&apos;s reorder level.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search stock" placeholder="Search product or SKU" className="w-full sm:w-64" />
          <FilterSelect label="Filter by stock level" value={stock} onChange={setStock} options={stockOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} products</span>
        </Toolbar>
        <DataTable
          rows={rows}
          getRowId={(product) => product.id}
          emptyMessage="No stock matches these filters."
          caption="Current stock levels"
          minWidth="720px"
          columns={[
            {
              key: "product",
              header: "PRODUCT",
              render: (product) => (
                <span className="min-w-0">
                  <span className="block max-w-[220px] truncate font-medium">{product.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                </span>
              ),
            },
            {
              key: "level",
              header: "COVER",
              render: (product) => {
                const percent = Math.min(100, Math.round((product.stock / Math.max(product.reorderLevel * 3, 1)) * 100));
                return (
                  <span className="flex min-w-[120px] items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max(percent, 4)}%`,
                          backgroundColor:
                            product.stock === 0 ? "var(--destructive)" : product.stock <= product.reorderLevel ? "var(--amber)" : "var(--emerald)",
                        }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">{percent}%</span>
                  </span>
                );
              },
            },
            { key: "reorder", header: "REORDER AT", align: "right", render: (product) => <span className="text-[10px] text-muted-foreground">{product.reorderLevel}</span> },
            { key: "stock", header: "ON HAND", align: "right", render: (product) => <span className="whitespace-nowrap font-semibold">{product.stock}</span> },
            { key: "value", header: "VALUE", align: "right", render: (product) => <span className="whitespace-nowrap">{formatKes(product.price * product.stock)}</span> },
            { key: "status", header: "STATUS", align: "right", render: (product) => <StatusBadge status={stockStatus(product)} /> },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Preview only · Confirm counts before ordering
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Recent stock movements</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Sales, deliveries, returns and adjustments.</p>
        </div>
        <DataTable
          rows={sampleStockMovements}
          getRowId={(movement) => movement.id}
          caption="Stock movements"
          minWidth="700px"
          columns={[
            { key: "date", header: "DATE", render: (movement) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{movement.date}</span> },
            {
              key: "product",
              header: "PRODUCT",
              render: (movement) => (
                <span className="min-w-0">
                  <span className="block max-w-[220px] truncate font-medium">{movement.product}</span>
                  <span className="block text-[10px] text-muted-foreground">{movement.sku}</span>
                </span>
              ),
            },
            {
              key: "type",
              header: "TYPE",
              render: (movement) => (
                <span
                  className={`inline-flex min-h-[23px] items-center rounded-[5px] px-2 text-[10px] font-medium ${
                    movement.type === "Received"
                      ? "bg-emerald-subtle text-emerald"
                      : movement.type === "Sale"
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber/10 text-amber"
                  }`}
                >
                  {movement.type}
                </span>
              ),
            },
            {
              key: "quantity",
              header: "QTY",
              align: "right",
              render: (movement) => (
                <span className={`whitespace-nowrap font-semibold ${movement.quantity < 0 ? "text-destructive" : "text-emerald"}`}>
                  {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                </span>
              ),
            },
            { key: "reference", header: "REFERENCE", align: "right", render: (movement) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{movement.reference}</span> },
            { key: "user", header: "BY", align: "right", render: (movement) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{movement.user}</span> },
          ]}
        />
      </section>
    </>
  );
}
