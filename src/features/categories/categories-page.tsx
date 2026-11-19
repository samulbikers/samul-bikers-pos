import { ArrowRight, LayoutGrid, Percent, ShoppingBag, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts, useSales } from "@/lib/supabase/queries";
import { formatKes, formatPercent } from "@/lib/format";

export function CategoriesPage() {
  const categoriesQuery = useCategories();
  const productsQuery = useProducts();
  const salesQuery = useSales(500);

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const rows = useMemo(() => {
    const revenueByCategory = new Map<string, number>();

    for (const sale of salesQuery.data ?? []) {
      if (sale.status === "Refunded") continue;
      for (const item of sale.pos_sale_items ?? []) {
        const product = products.find((entry) => entry.id === item.product_id);
        if (!product) continue;
        revenueByCategory.set(
          product.categoryName,
          (revenueByCategory.get(product.categoryName) ?? 0) + Number(item.line_total),
        );
      }
    }

    return categories.map((category) => {
      const inCategory = products.filter((product) => product.categoryId === category.id);
      const priced = inCategory.filter((product) => product.margin !== null);
      return {
        ...category,
        productCount: inCategory.length,
        revenue: revenueByCategory.get(category.name) ?? 0,
        margin: priced.length
          ? Math.round(priced.reduce((sum, product) => sum + (product.margin ?? 0), 0) / priced.length)
          : null,
      };
    });
  }, [categories, products, salesQuery.data]);

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const highestMargin = rows.reduce<number | null>(
    (best, row) => (row.margin === null ? best : best === null ? row.margin : Math.max(best, row.margin)),
    null,
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Live product groups from the shop website, with revenue mix and margin."
        meta={
          categoriesQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Synced with Supabase
            </span>
          ) : null
        }
        actions={
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link to="/products">
              <ShoppingBag aria-hidden="true" className="size-3.5" />
              Browse products
            </Link>
          </Button>
        }
      />

      <SupabaseNotice />
      {categoriesQuery.isError && <QueryError error={categoriesQuery.error} label="Could not load categories" />}

      <section aria-label="Category summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={LayoutGrid} title="Categories" value={String(categories.length)} note="active groups" color="var(--chart-1)" />
        <StatCard icon={ShoppingBag} title="Products" value={String(products.length)} note="across all groups" color="var(--chart-2)" />
        <StatCard icon={Wallet} title="Recorded revenue" value={formatKes(totalRevenue)} note="from completed sales" color="var(--chart-3)" />
        <StatCard
          icon={Percent}
          title="Best margin"
          value={highestMargin === null ? "—" : formatPercent(highestMargin)}
          note={highestMargin === null ? "set cost prices to see margin" : "across categories"}
          color="var(--chart-4)"
        />
      </section>

      {categoriesQuery.isLoading ? (
        <QueryLoading label="Loading categories..." />
      ) : !rows.length ? (
        <EmptyState
          title="No categories yet"
          description="Categories created in the shop website admin will appear here automatically."
        />
      ) : (
        <section aria-label="Category cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((category) => {
            const share = totalRevenue > 0 ? Math.round((category.revenue / totalRevenue) * 100) : 0;

            return (
              <article
                key={category.id}
                className="rise-in flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]"
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-muted text-muted-foreground">
                    <LayoutGrid aria-hidden="true" className="size-6" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[15px] font-semibold text-card-foreground">{category.name}</h3>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {category.productCount} items
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.6] text-muted-foreground">
                    {category.blurb || "No description yet."}
                  </p>
                  <dl className="mt-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Revenue</dt>
                      <dd className="font-semibold text-card-foreground">{formatKes(category.revenue)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Margin</dt>
                      <dd className="font-medium text-emerald">
                        {category.margin === null ? "—" : `${category.margin}%`}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-amber"
                        style={{ width: `${Math.max(share, 4)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{share}% of recorded revenue</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="mt-3 h-8 justify-start gap-1 px-0 text-[11px] text-primary hover:bg-transparent">
                    <Link to="/products">
                      View products
                      <ArrowRight aria-hidden="true" className="size-3" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <SectionCard title="Mix by category" description="Share of recorded takings" footer="Calculated from sales saved in Supabase.">
        {rows.some((row) => row.revenue > 0) ? (
          <ul className="space-y-3">
            {rows.map((category) => (
              <li key={category.id} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-[11px] text-muted-foreground">{category.name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(Math.round((category.revenue / Math.max(totalRevenue, 1)) * 100), 2)}%`,
                      backgroundColor: "var(--chart-1)",
                    }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right text-[11px] font-medium text-card-foreground">
                  {formatKes(category.revenue)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No sales recorded yet"
            description="Complete a sale in the point of sale and the category mix will fill in here."
          />
        )}
      </SectionCard>
    </>
  );
}
