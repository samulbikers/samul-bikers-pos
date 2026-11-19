import { Download, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GroupedBars, ProgressRow } from "@/components/data/charts";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useProducts, useSales } from "@/lib/supabase/queries";
import { formatKes, formatKesCompact } from "@/lib/format";

const periodOptions = ["Last 30 days", "Last 90 days", "Year to date", "All time"] as const;
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function withinPeriod(iso: string, period: string, now: Date) {
  if (period === "All time") return true;
  const days = period === "Last 30 days" ? 30 : period === "Last 90 days" ? 90 : now.getMonth() * 31 + now.getDate();
  return new Date(iso).getTime() >= now.getTime() - days * 86_400_000;
}

export function ReportsPage() {
  const salesQuery = useSales(1000);
  const productsQuery = useProducts();
  const [period, setPeriod] = useState<string>(periodOptions[0]);

  const now = useMemo(() => new Date(), []);
  const products = productsQuery.data ?? [];

  const sales = useMemo(
    () =>
      (salesQuery.data ?? []).filter(
        (sale) => sale.status !== "Refunded" && withinPeriod(sale.created_at, period, now),
      ),
    [salesQuery.data, period, now],
  );

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const profit = useMemo(() => {
    let total = 0;
    let known = false;
    for (const sale of sales) {
      for (const item of sale.pos_sale_items ?? []) {
        const product = products.find((entry) => entry.id === item.product_id);
        if (!product || product.cost === null) continue;
        total += (Number(item.unit_price) - product.cost) * item.quantity;
        known = true;
      }
    }
    return known ? total : null;
  }, [sales, products]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      const date = new Date(sale.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      map.set(key, (map.get(key) ?? 0) + Number(sale.total));
    }

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return { label: monthLabels[date.getMonth()]!, value: map.get(key) ?? 0 };
    });
  }, [sales, now]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; units: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.pos_sale_items ?? []) {
        const key = item.product_id ?? item.product_title;
        const current = map.get(key) ?? { title: item.product_title, units: 0, revenue: 0 };
        map.set(key, {
          title: current.title,
          units: current.units + item.quantity,
          revenue: current.revenue + Number(item.line_total),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.units - a.units).slice(0, 8);
  }, [sales]);

  const paymentMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      map.set(sale.payment_method, (map.get(sale.payment_method) ?? 0) + Number(sale.total));
    }
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percent: total ? Math.round((amount / total) * 100) : 0,
        color: `var(--chart-${index === 0 ? 1 : index === 1 ? 3 : 4})`,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [sales]);

  const categoryMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of sales) {
      for (const item of sale.pos_sale_items ?? []) {
        const product = products.find((entry) => entry.id === item.product_id);
        const name = product?.categoryName ?? "Uncategorised";
        map.set(name, (map.get(name) ?? 0) + Number(item.line_total));
      }
    }
    const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percent: total ? Math.round((amount / total) * 100) : 0,
        color: `var(--chart-${(index % 5) + 1})`,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [sales, products]);

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Trading trends, margins and top sellers calculated from recorded receipts."
        meta={
          salesQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live from Supabase
            </span>
          ) : null
        }
        actions={
          <>
            <FilterSelect label="Report period" value={period} onChange={setPeriod} options={periodOptions} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5"
              onClick={() => toast.info("Report export is not enabled in this workspace.")}
            >
              <Download aria-hidden="true" className="size-3.5" />
              Export
            </Button>
          </>
        }
      />

      <SupabaseNotice />
      {salesQuery.isError && <QueryError error={salesQuery.error} label="Could not load sales" />}

      <section aria-label="Report summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={TrendingUp} title="Revenue" value={formatKesCompact(revenue)} note={`${sales.length} receipts`} color="var(--chart-1)" />
        <StatCard
          icon={TrendingUp}
          title="Gross profit"
          value={profit === null ? "—" : formatKesCompact(profit)}
          note={profit === null ? "set cost prices to track margin" : "from recorded cost prices"}
          color="var(--chart-2)"
        />
        <StatCard
          icon={TrendingUp}
          title="Average basket"
          value={sales.length ? formatKes(Math.round(revenue / sales.length)) : "—"}
          note="per receipt"
          color="var(--chart-4)"
        />
        <StatCard
          icon={TrendingUp}
          title="Net margin"
          value={profit === null || revenue === 0 ? "—" : `${Math.round((profit / revenue) * 100)}%`}
          note="gross profit ÷ revenue"
          color="var(--chart-3)"
        />
      </section>

      <SectionCard
        title="Revenue by month"
        description={`Last six months · ${period.toLowerCase()}`}
        action={
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
              Revenue
            </span>
          </div>
        }
        footer="Calculated from recorded receipts"
        bodyClassName="px-2 pb-4 pt-3 sm:px-4 sm:pb-5"
      >
        {salesQuery.isLoading ? (
          <QueryLoading label="Loading revenue..." />
        ) : revenue === 0 ? (
          <EmptyState title="No revenue in this period" description="Record a sale to populate the report." />
        ) : (
          <div className="h-[210px]">
            <GroupedBars
              label="Revenue by month"
              data={monthly.map((month) => ({ label: month.label, values: [month.value] }))}
              series={[{ name: "Revenue", color: "var(--chart-1)" }]}
            />
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Top selling products</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Ranked by units sold in the selected period.</p>
          </div>
          {salesQuery.isLoading ? (
            <div className="px-4 pb-4 sm:px-5">
              <QueryLoading label="Loading products..." />
            </div>
          ) : !topProducts.length ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState title="Nothing sold yet" description="Top sellers appear once receipts exist." />
            </div>
          ) : (
            <DataTable
              rows={topProducts}
              getRowId={(product) => product.title}
              caption="Top selling products"
              minWidth="460px"
              columns={[
                {
                  key: "name",
                  header: "PRODUCT",
                  render: (product) => <span className="block max-w-[260px] truncate font-medium">{product.title}</span>,
                },
                { key: "units", header: "UNITS", align: "right", render: (product) => <span>{product.units}</span> },
                {
                  key: "revenue",
                  header: "REVENUE",
                  align: "right",
                  render: (product) => <span className="whitespace-nowrap font-semibold">{formatKes(product.revenue)}</span>,
                },
              ]}
            />
          )}
          <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
            Ranking uses recorded receipt lines.
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <SectionCard title="Payment mix" description="Share of recorded takings" footer="Across the selected period.">
            {paymentMix.length ? (
              <ul className="space-y-3">
                {paymentMix.map((item) => (
                  <ProgressRow key={item.name} label={item.name} percent={item.percent} color={item.color} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No payments yet" description="Payment mix appears once sales exist." />
            )}
          </SectionCard>
          <SectionCard title="Category mix" description="Revenue by product group" footer="Derived from receipt lines.">
            {categoryMix.length ? (
              <ul className="space-y-3">
                {categoryMix.map((category) => (
                  <ProgressRow
                    key={category.name}
                    label={category.name}
                    percent={category.percent}
                    color={category.color}
                    value={formatKes(category.amount)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title="No category sales yet" description="Category mix appears once sales exist." />
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
