import { Boxes, Layers, Percent, ShoppingBag, Tags } from "lucide-react";
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
import { useProducts, type CatalogProduct } from "@/lib/supabase/queries";
import { useUpdateProduct } from "@/lib/supabase/mutations";
import { formatKes, formatPercent } from "@/lib/format";

const stockOptions = ["All stock levels", "In stock", "Low stock", "Out of stock"] as const;

function stockState(product: CatalogProduct) {
  if (product.stock <= 0) return "Out of stock";
  if (product.stock <= product.reorderLevel) return "Low stock";
  return "In stock";
}

export function ProductsPage() {
  const productsQuery = useProducts();
  const updateProduct = useUpdateProduct();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stock, setStock] = useState<string>(stockOptions[0]);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [draft, setDraft] = useState({ stock: "", cost: "", reorder: "" });

  const products = productsQuery.data ?? [];
  const categoryOptions = useMemo(
    () => ["All categories", ...Array.from(new Set(products.map((product) => product.categoryName))).sort()],
    [products],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !needle || `${product.title} ${product.sku}`.toLowerCase().includes(needle);
      const matchesCategory = category === "All categories" || product.categoryName === category;
      const matchesStock = stock === stockOptions[0] || stockState(product) === stock;
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, category, stock]);

  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStock = products.filter((product) => stockState(product) !== "In stock").length;
  const priced = products.filter((product) => product.margin !== null);
  const averageMargin = priced.length
    ? priced.reduce((sum, product) => sum + (product.margin ?? 0), 0) / priced.length
    : null;

  const openProduct = (product: CatalogProduct) => {
    setSelected(product);
    setDraft({
      stock: String(product.stock),
      cost: product.cost === null ? "" : String(product.cost),
      reorder: String(product.reorderLevel),
    });
  };

  const saveProduct = async () => {
    if (!selected) return;

    try {
      await updateProduct.mutateAsync({
        id: selected.id,
        stock: draft.stock === "" ? undefined : Number(draft.stock),
        cost: draft.cost === "" ? undefined : Number(draft.cost),
        reorder: draft.reorder === "" ? undefined : Number(draft.reorder),
      });
      toast.success("Product updated", { description: `${selected.title} saved to Supabase.` });
      setSelected(null);
    } catch (error) {
      toast.error("Could not update the product", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Live catalogue from the shop website, with stock, cost and margin."
        meta={
          productsQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Synced with Supabase
            </span>
          ) : null
        }
      />

      <SupabaseNotice />
      {productsQuery.isError && <QueryError error={productsQuery.error} label="Could not load products" />}

      <section aria-label="Product summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ShoppingBag} title="Catalogue size" value={String(products.length)} note="live products" color="var(--chart-1)" />
        <StatCard icon={Boxes} title="Stock value" value={formatKes(stockValue)} note="retail price × units" color="var(--chart-2)" />
        <StatCard icon={Tags} title="Needs attention" value={String(lowStock)} note="low or out of stock" color="var(--chart-4)" />
        <StatCard
          icon={Percent}
          title="Average margin"
          value={averageMargin === null ? "—" : formatPercent(averageMargin, 1)}
          note={averageMargin === null ? "add cost prices to see margins" : "sample cost basis"}
          color="var(--chart-3)"
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Product catalogue</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Select a product to set its stock level, reorder point or cost price.
          </p>
        </div>
        <Toolbar>
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search products"
            placeholder="Search product or SKU"
            className="w-full sm:w-64"
          />
          <FilterSelect label="Filter by category" value={category} onChange={setCategory} options={categoryOptions} />
          <FilterSelect label="Filter by stock level" value={stock} onChange={setStock} options={stockOptions} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Layers aria-hidden="true" className="size-3" />
            {rows.length} shown
          </span>
        </Toolbar>

        {productsQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading products..." />
          </div>
        ) : !products.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No products yet"
              description="Products added in the shop website admin will appear here automatically."
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(product) => product.id}
            emptyMessage="No products match these filters."
            caption="Product catalogue"
            minWidth="800px"
            columns={[
              {
                key: "product",
                header: "PRODUCT",
                render: (product) => (
                  <span className="flex items-center gap-2.5">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="size-9 shrink-0 rounded-md border border-border object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                        <ShoppingBag aria-hidden="true" className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className="block max-w-[210px] truncate text-left font-medium text-primary hover:underline"
                      >
                        {product.title}
                      </button>
                      <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "category",
                header: "CATEGORY",
                render: (product) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{product.categoryName}</span>
                ),
              },
              {
                key: "price",
                header: "PRICE",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap font-semibold">{formatKes(product.price)}</span>
                ),
              },
              {
                key: "cost",
                header: "COST",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {product.cost === null ? "—" : formatKes(product.cost)}
                  </span>
                ),
              },
              {
                key: "margin",
                header: "MARGIN",
                align: "right",
                render: (product) =>
                  product.margin === null ? (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  ) : (
                    <span className="whitespace-nowrap text-emerald">{formatPercent(product.margin, 1)}</span>
                  ),
              },
              {
                key: "stock",
                header: "STOCK",
                align: "right",
                render: (product) => (
                  <span className="whitespace-nowrap">
                    <span className="font-semibold">{product.stock}</span>
                    <span className="text-[10px] text-muted-foreground"> units</span>
                  </span>
                ),
              },
              {
                key: "status",
                header: "STATUS",
                align: "right",
                render: (product) => <StatusBadge status={stockState(product)} />,
              },
            ]}
          />
        )}
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Catalogue comes from the shop website · Stock and cost are saved to Supabase
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{selected?.title}</DialogTitle>
            <DialogDescription className="text-[11px]">
              {selected?.sku} · {selected?.categoryName}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-md border border-border p-2">
                  <p className="text-[10px] text-muted-foreground">Price</p>
                  <p className="mt-0.5 font-semibold text-card-foreground">{formatKes(selected.price)}</p>
                </div>
                <div className="rounded-md border border-border p-2">
                  <p className="text-[10px] text-muted-foreground">Cost</p>
                  <p className="mt-0.5 font-semibold text-card-foreground">
                    {selected.cost === null ? "Not set" : formatKes(selected.cost)}
                  </p>
                </div>
                <div className="rounded-md border border-border p-2">
                  <p className="text-[10px] text-muted-foreground">Margin</p>
                  <p className="mt-0.5 font-semibold text-emerald">
                    {selected.margin === null ? "—" : formatPercent(selected.margin, 1)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="product-stock" className="text-[10px]">
                    Stock on hand
                  </Label>
                  <Input
                    id="product-stock"
                    inputMode="numeric"
                    value={draft.stock}
                    onChange={(event) => setDraft({ ...draft, stock: event.target.value.replace(/[^0-9]/g, "") })}
                    className="h-9 text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-reorder" className="text-[10px]">
                    Reorder at
                  </Label>
                  <Input
                    id="product-reorder"
                    inputMode="numeric"
                    value={draft.reorder}
                    onChange={(event) => setDraft({ ...draft, reorder: event.target.value.replace(/[^0-9]/g, "") })}
                    className="h-9 text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-cost" className="text-[10px]">
                    Unit cost
                  </Label>
                  <Input
                    id="product-cost"
                    inputMode="numeric"
                    value={draft.cost}
                    onChange={(event) => setDraft({ ...draft, cost: event.target.value.replace(/[^0-9.]/g, "") })}
                    className="h-9 text-[11px]"
                  />
                </div>
              </div>

              <p className="rounded-md bg-muted/50 p-2 text-[10px] text-muted-foreground">
                Changing stock writes an inventory adjustment so the movement history stays auditable.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setSelected(null)} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={saveProduct} disabled={updateProduct.isPending} className="h-9">
              {updateProduct.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
