import { ArrowRight, LayoutGrid, Percent, ShoppingBag, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { PreviewBadge } from "@/components/data/preview-badge";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sampleCategories, sampleProducts } from "@/data/sample/catalog";
import { categoryAltText, categoryImages } from "@/data/sample/images";
import { formatKes, formatPercent } from "@/lib/format";

export function CategoriesPage() {
  const totalRevenue = sampleCategories.reduce((sum, category) => sum + category.revenue, 0);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Product groups that shape the catalogue, with revenue mix and margin."
        meta={<PreviewBadge />}
        actions={
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link to="/products">
              <ShoppingBag aria-hidden="true" className="size-3.5" />
              Browse products
            </Link>
          </Button>
        }
      />

      <section aria-label="Category summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={LayoutGrid} title="Categories" value={String(sampleCategories.length)} note="active groups" color="var(--chart-1)" />
        <StatCard icon={ShoppingBag} title="Products" value={String(sampleProducts.length)} note="across all groups" color="var(--chart-2)" />
        <StatCard icon={Wallet} title="Category revenue" value={formatKes(totalRevenue)} note="last 30 sample days" color="var(--chart-3)" />
        <StatCard
          icon={Percent}
          title="Best margin"
          value={formatPercent(Math.max(...sampleCategories.map((category) => category.margin)))}
          note="accessories lead"
          color="var(--chart-4)"
        />
      </section>

      <section aria-label="Category cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sampleCategories.map((category) => {
          const share = Math.round((category.revenue / totalRevenue) * 100);

          return (
            <article
              key={category.name}
              className="rise-in flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]"
            >
              <img
                src={categoryImages[category.name]}
                alt={categoryAltText[category.name]}
                className="h-32 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-[15px] font-semibold text-card-foreground">{category.name}</h3>
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {category.products} items
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-[1.6] text-muted-foreground">{category.description}</p>
                <dl className="mt-4 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Revenue</dt>
                    <dd className="font-semibold text-card-foreground">{formatKes(category.revenue)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Margin</dt>
                    <dd className="font-medium text-emerald">{category.margin}%</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-amber"
                      style={{ width: `${Math.max(share, 6)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{share}% of sample revenue</p>
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

      <SectionCard title="Mix by category" description="Share of sample takings in the last 30 days" footer="Category performance is illustrative.">
        <ul className="space-y-3">
          {sampleCategories.map((category) => (
            <li key={category.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-[11px] text-muted-foreground">{category.name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.round((category.revenue / totalRevenue) * 100)}%`, backgroundColor: "var(--chart-1)" }}
                />
              </span>
              <span className="w-24 shrink-0 text-right text-[11px] font-medium text-card-foreground">
                {formatKes(category.revenue)}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}
