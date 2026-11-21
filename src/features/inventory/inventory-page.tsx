import { ArrowDownLeft, ArrowUpRight, Boxes, ClipboardCheck, PackagePlus, PackageSearch, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts, useStockMovements, type CatalogProduct } from "@/lib/supabase/queries";
import { useUpdateProduct } from "@/lib/supabase/mutations";
import { formatDate, formatKes } from "@/lib/format";

const stockOptions = ["All stock levels", "In stock", "Low stock", "Out of stock"] as const;

function stockState(product: CatalogProduct) {
  if (product.stock <= 0) return "Out of stock";
  if (product.stock <= product.reorderLevel) return "Low stock";
  return "In stock";
}

export function InventoryPage() {
  const productsQuery = useProducts();
  const movementsQuery = useStockMovements(40);
  const updateProduct = useUpdateProduct();

  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<string>(stockOptions[0]);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [countValue, setCountValue] = useState("");
  const [mode, setMode] = useState<"count" | "receive" | "clear">("count");

  const products = productsQuery.data ?? [];

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !needle || `${product.title} ${product.sku}`.toLowerCase().includes(needle);
      const matchesStock = stock === stockOptions[0] || stockState(product) === stock;
      return matchesQuery && matchesStock;
    });
  }, [products, query, stock]);

  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const unitsOnHand = products.reduce((sum, product) => sum + product.stock, 0);
  const lowCount = products.filter((product) => stockState(product) === "Low stock").length;
  const outCount = products.filter((product) => stockState(product) === "Out of stock").length;

  const openAdjust = (product: CatalogProduct, nextMode: "count" | "receive" | "clear") => {
    setSelected(product);
    setMode(nextMode);
    setCountValue(nextMode === "receive" ? "0" : String(product.stock));
  };

  const nextStock = selected
    ? mode === "receive"
      ? selected.stock + Number(countValue || 0)
      : mode === "clear"
        ? 0
        : Number(countValue || 0)
    : 0;

  const saveCount = async () => {
    if (!selected) return;

    try {
      await updateProduct.mutateAsync({ id: selected.id, stock: nextStock });
      toast.success(mode === "receive" ? "Stock received" : mode === "clear" ? "Stock cleared" : "Stock count saved", {
        description: `${selected.title} · ${nextStock} units saved to Supabase.`,
      });
      setSelected(null);
    } catch (error) {
      toast.error("Could not update the stock level", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock on hand from Supabase, with a full movement history."
        meta={
          productsQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live stock
            </span>
          ) : null
        }
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            disabled={!products.length}
            onClick={() => openAdjust(products[0]!, "count")}
          >
            <ClipboardCheck aria-hidden="true" className="size-3.5" />
            Record stock count
          </Button>
        }
      />

      <SupabaseNotice />
      {productsQuery.isError && <QueryError error={productsQuery.error} label="Could not load stock" />}

      <section aria-label="Inventory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Boxes} title="Units on hand" value={String(unitsOnHand)} note="across all categories" color="var(--chart-1)" />
        <StatCard icon={PackageSearch} title="Stock value" value={formatKes(stockValue)} note="retail valuation" color="var(--chart-2)" />
        <StatCard icon={ArrowDownLeft} title="Low stock" value={String(lowCount)} note="at or below reorder level" color="var(--chart-4)" />
        <StatCard icon={ArrowUpRight} title="Out of stock" value={String(outCount)} note="cannot be sold" color="var(--chart-5)" trend="down" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Stock levels</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Reorder alerts use each product&apos;s reorder level. Select a row to record a count.
          </p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search stock" placeholder="Search product or SKU" className="w-full sm:w-64" />
          <FilterSelect label="Filter by stock level" value={stock} onChange={setStock} options={stockOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} products</span>
        </Toolbar>

        {productsQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading stock..." />
          </div>
        ) : !products.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState title="Nothing in stock yet" description="Products from the shop catalogue will appear here." />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(product) => product.id}
            emptyMessage="No stock matches these filters."
            caption="Current stock levels"
            minWidth="760px"
            columns={[
              {
                key: "product",
                header: "PRODUCT",
                render: (product) => (
                  <span className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openAdjust(product, "count")}
                      className="block max-w-[230px] truncate text-left font-medium text-primary hover:underline"
                    >
                      {product.title}
                    </button>
                    <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                  </span>
                ),
              },
              {
                key: "level",
                header: "COVER",
                render: (product) => {
                  const target = Math.max(product.reorderLevel * 3, 1);
                  const percent = Math.min(100, Math.round((product.stock / target) * 100));
                  return (
                    <span className="flex min-w-[120px] items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(percent, 4)}%`,
                            backgroundColor:
                              product.stock === 0
                                ? "var(--destructive)"
                                : product.stock <= product.reorderLevel
                                  ? "var(--amber)"
                                  : "var(--emerald)",
                          }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">{percent}%</span>
                    </span>
                  );
                },
              },
              {
                key: "reorder",
                header: "REORDER AT",
                align: "right",
                render: (product) => <span className="text-[10px] text-muted-foreground">{product.reorderLevel}</span>,
              },
              {
                key: "stock",
                header: "ON HAND",
                align: "right",
                render: (product) => <span className="whitespace-nowrap font-semibold">{product.stock}</span>,
              },
              {
                key: "value",
                header: "VALUE",
                align: "right",
                render: (product) => <span className="whitespace-nowrap">{formatKes(product.price * product.stock)}</span>,
              },
              {
                key: "status",
                header: "STATUS",
                align: "right",
                render: (product) => <StatusBadge status={stockState(product)} />,
              },
              {
                key: "actions",
                header: "ACTIONS",
                align: "right",
                render: (product) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px]"
                      onClick={() => openAdjust(product, "receive")}
                    >
                      <PackagePlus aria-hidden="true" className="size-3" />
                      Add stock
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-destructive"
                      onClick={() => openAdjust(product, "clear")}
                    >
                      <Trash2 aria-hidden="true" className="size-3" />
                      Clear
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Stock updates write an audit trail in inventory movements
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Recent stock movements</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Sales, deliveries, returns and manual adjustments.</p>
        </div>
        {movementsQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading movements..." />
          </div>
        ) : movementsQuery.isError ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryError error={movementsQuery.error} label="Could not load stock movements" />
          </div>
        ) : !movementsQuery.data?.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No movements yet"
              description="Complete a sale or record a stock count to start the movement history."
            />
          </div>
        ) : (
          <DataTable
            rows={movementsQuery.data}
            getRowId={(movement) => movement.id}
            caption="Stock movements"
            minWidth="720px"
            columns={[
              {
                key: "date",
                header: "DATE",
                render: (movement) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{formatDate(movement.created_at)}</span>
                ),
              },
              {
                key: "product",
                header: "PRODUCT",
                render: (movement) => (
                  <span className="block max-w-[240px] truncate font-medium">{movement.product_title}</span>
                ),
              },
              {
                key: "type",
                header: "TYPE",
                render: (movement) => (
                  <span
                    className={`inline-flex min-h-[23px] items-center rounded-[5px] px-2 text-[10px] font-medium ${
                      movement.movement_type === "Received"
                        ? "bg-emerald-subtle text-emerald"
                        : movement.movement_type === "Sale"
                          ? "bg-muted text-muted-foreground"
                          : "bg-amber/10 text-amber"
                    }`}
                  >
                    {movement.movement_type}
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
              {
                key: "reference",
                header: "REFERENCE",
                align: "right",
                render: (movement) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{movement.reference ?? "—"}</span>
                ),
              },
              {
                key: "user",
                header: "BY",
                align: "right",
                render: (movement) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{movement.user_name}</span>
                ),
              },
            ]}
          />
        )}
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {mode === "receive" ? "Receive stock" : mode === "clear" ? "Clear stock" : "Record stock count"}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              {selected?.title} · currently {selected?.stock} units
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {mode === "clear" ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[11px] text-destructive">
                This sets the stock level to 0 and logs an adjustment. The product stays on the website but shows as out of stock.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="stock-count" className="text-[11px]">
                  {mode === "receive" ? "Units received" : "Counted quantity"}
                </Label>
                <Input
                  id="stock-count"
                  inputMode="numeric"
                  value={countValue}
                  onChange={(event) => setCountValue(event.target.value.replace(/[^0-9]/g, ""))}
                  className="h-9 text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">
                  {mode === "receive"
                    ? `New stock level will be ${nextStock} units.`
                    : "The counted quantity replaces the current stock level and is logged as an adjustment."}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setSelected(null)} className="h-9">
              Cancel
            </Button>
            <Button
              type="button"
              variant={mode === "clear" ? "destructive" : "default"}
              onClick={saveCount}
              disabled={updateProduct.isPending}
              className="h-9"
            >
              {updateProduct.isPending ? "Saving..." : mode === "receive" ? "Add stock" : mode === "clear" ? "Clear stock" : "Save count"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
