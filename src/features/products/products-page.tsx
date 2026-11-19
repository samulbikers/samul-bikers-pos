import { Boxes, Layers, Percent, ShoppingBag, Tags } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sampleProducts, stockStatus, type Product } from "@/data/sample/catalog";
import { categoryAltText, categoryImages, type ProductCategory } from "@/data/sample/images";
import { formatKes, formatPercent } from "@/lib/format";

const categoryOptions = [
  "All categories",
  "Riding gear",
  "Tail boxes",
  "Accessories",
  "Safety gear",
] as const;
const stockOptions = ["All stock levels", "In stock", "Low stock", "Out of stock"] as const;

function marginOf(product: Product) {
  return ((product.price - product.cost) / product.price) * 100;
}

export function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(categoryOptions[0]);
  const [stock, setStock] = useState<string>(stockOptions[0]);
  const [selected, setSelected] = useState<Product | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleProducts.filter((product) => {
      const matchesQuery = !needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle);
      const matchesCategory = category === categoryOptions[0] || product.category === category;
      const matchesStock = stock === stockOptions[0] || stockStatus(product) === stock;
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [query, category, stock]);

  const stockValue = sampleProducts.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStock = sampleProducts.filter((product) => stockStatus(product) !== "In stock").length;
  const averageMargin =
    sampleProducts.reduce((sum, product) => sum + marginOf(product), 0) / sampleProducts.length;

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue of everything the shop sells, with pricing, cost and margin at a glance."
        meta={<PreviewBadge />}
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" disabled title="Catalogue editing arrives with the live backend">
            <ShoppingBag aria-hidden="true" className="size-3.5" />
            Add product
          </Button>
        }
      />

      <section aria-label="Product summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ShoppingBag} title="Catalogue size" value={String(sampleProducts.length)} note="active sample products" color="var(--chart-1)" />
        <StatCard icon={Boxes} title="Stock value" value={formatKes(stockValue)} note="at retail price" color="var(--chart-2)" />
        <StatCard icon={Tags} title="Needs attention" value={String(lowStock)} note="low or out of stock" color="var(--chart-4)" />
        <StatCard icon={Percent} title="Average margin" value={formatPercent(averageMargin, 1)} note="sample cost basis" color="var(--chart-3)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Product catalogue</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Selling prices include VAT where applicable.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search products" placeholder="Search product or SKU" className="w-full sm:w-64" />
          <FilterSelect label="Filter by category" value={category} onChange={setCategory} options={[...categoryOptions]} />
          <FilterSelect label="Filter by stock level" value={stock} onChange={setStock} options={stockOptions} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Layers aria-hidden="true" className="size-3" />
            {rows.length} shown
          </span>
        </Toolbar>
        <DataTable
          rows={rows}
          getRowId={(product) => product.id}
          emptyMessage="No products match these filters."
          caption="Product catalogue"
          minWidth="780px"
          columns={[
            {
              key: "product",
              header: "PRODUCT",
              render: (product) => (
                <span className="flex items-center gap-2.5">
                  <img src={categoryImages[product.category]} alt={categoryAltText[product.category]} className="size-9 shrink-0 rounded-md border border-border object-cover" />
                  <span className="min-w-0">
                    <button type="button" onClick={() => setSelected(product)} className="block max-w-[190px] truncate text-left font-medium text-primary hover:underline">
                      {product.name}
                    </button>
                    <span className="block text-[10px] text-muted-foreground">{product.sku}</span>
                  </span>
                </span>
              ),
            },
            { key: "category", header: "CATEGORY", render: (product) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{product.category}</span> },
            { key: "price", header: "PRICE", align: "right", render: (product) => <span className="whitespace-nowrap font-semibold">{formatKes(product.price)}</span> },
            { key: "cost", header: "COST", align: "right", render: (product) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{formatKes(product.cost)}</span> },
            { key: "margin", header: "MARGIN", align: "right", render: (product) => <span className="whitespace-nowrap text-emerald">{formatPercent(marginOf(product), 1)}</span> },
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
            { key: "status", header: "STATUS", align: "right", render: (product) => <StatusBadge status={stockStatus(product)} /> },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Catalogue editing is disabled in the preview workspace.
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{selected?.name}</DialogTitle>
            <DialogDescription className="text-[11px]">
              {selected?.sku} · {selected?.category}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <img src={categoryImages[selected.category]} alt={categoryAltText[selected.category]} className="h-36 w-full rounded-md border border-border object-cover" />
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Selling price</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{formatKes(selected.price)}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Unit cost</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{formatKes(selected.cost)}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Margin</dt>
                  <dd className="mt-0.5 font-semibold text-emerald">{formatPercent(marginOf(selected), 1)}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Units sold</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{selected.unitsSold}</dd>
                </div>
              </dl>
              <div className="flex items-center justify-between rounded-md border border-border p-2 text-[11px]">
                <span className="text-muted-foreground">Stock on hand</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-card-foreground">{selected.stock} units</span>
                  <StatusBadge status={stockStatus(selected)} />
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
