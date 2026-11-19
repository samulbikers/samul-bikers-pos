import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileWarning,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AreaTrend, DistributionBar, ProgressRow } from "@/components/data/charts";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useProducts, useSales, useSiteSettings, useStockMovements } from "@/lib/supabase/queries";
import type { DbSale } from "@/lib/supabase/types";
import { formatDate, formatKes } from "@/lib/format";
import { CashierDashboard } from "./cashier-dashboard";

type Range = "Today" | "Yesterday" | "Last 7 days" | "Last 30 days" | "This month";
const ranges: Range[] = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nairobiDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(date);
}

function inRange(sale: DbSale, range: Range, now: Date) {
  const saleDate = new Date(sale.created_at);
  const today = nairobiDayKey(now);
  const saleDay = nairobiDayKey(saleDate);

  if (range === "Today") return saleDay === today;

  if (range === "Yesterday") {
    const yesterday = new Date(now.getTime() - 86_400_000);
    return saleDay === nairobiDayKey(yesterday);
  }

  const days = range === "Last 7 days" ? 7 : range === "Last 30 days" ? 30 : now.getDate();
  return saleDate.getTime() >= now.getTime() - days * 86_400_000;
}

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "cashier") return <CashierDashboard />;

  return <ManagerDashboard />;
}

function ManagerDashboard() {
  const [range, setRange] = useState<Range>("Last 7 days");
  const salesQuery = useSales(500);
  const productsQuery = useProducts();
  const movementsQuery = useStockMovements(5);
  const settingsQuery = useSiteSettings();

  const now = useMemo(() => new Date(), []);
  const products = productsQuery.data ?? [];
  const sales = salesQuery.data ?? [];

  const filtered = useMemo(
    () => sales.filter((sale) => inRange(sale, range, now) && sale.status !== "Refunded"),
    [sales, range, now],
  );

  const revenue = filtered.reduce((sum, sale) => sum + Number(sale.total), 0);
  const transactions = filtered.length;
  const profit = useMemo(() => {
    let total = 0;
    let known = false;
    for (const sale of filtered) {
      for (const item of sale.pos_sale_items ?? []) {
        const product = products.find((entry) => entry.id === item.product_id);
        if (!product || product.cost === null) continue;
        total += (Number(item.unit_price) - product.cost) * item.quantity;
        known = true;
      }
    }
    return known ? total : null;
  }, [filtered, products]);

  const series = useMemo(() => {
    const buckets = range === "Last 30 days" || range === "This month" ? 10 : 7;
    const values = Array.from({ length: buckets }, () => 0);
    const labels = Array.from({ length: buckets }, (_, index) => {
      if (range === "Today" || range === "Yesterday") return `${8 + index * 2}h`;
      if (buckets === 7) return dayLabels[(now.getDay() - 6 + index + 7) % 7] ?? "";
      return `W${index + 1}`;
    });

    if (!filtered.length) return { values, labels };

    const minTime = Math.min(...filtered.map((sale) => new Date(sale.created_at).getTime()));
    const maxTime = Math.max(now.getTime(), minTime + 1);
    const span = Math.max(maxTime - minTime, 1);

    for (const sale of filtered) {
      const position = (new Date(sale.created_at).getTime() - minTime) / span;
      const index = Math.min(buckets - 1, Math.floor(position * buckets));
      values[index] = (values[index] ?? 0) + Number(sale.total);
    }

    return { values, labels };
  }, [filtered, range, now]);

  const categoryMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of filtered) {
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
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filtered, products]);

  const paymentMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of filtered) {
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
  }, [filtered]);

  const lowStock = products
    .filter((product) => product.stock <= product.reorderLevel)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  const settings = settingsQuery.data;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${settings?.business_name ?? "Samul Bikers"}`}
        description="Live trading position pulled from the shop database."
        meta={
          <>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live data
            </span>
            <span className="inline-flex h-6 items-center gap-2 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-foreground">
              {settings ? `${settings.address_line1}, ${settings.city}` : "Main branch"}
            </span>
          </>
        }
        actions={
          <>
            <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground">
              <span className="sr-only">Sales period</span>
              <FilterSelect
                label="Dashboard date range"
                value={range}
                onChange={(value) => setRange(value as Range)}
                options={ranges}
                className="h-7 border-0 bg-transparent px-0 pr-5"
              />
              <ChevronDown aria-hidden="true" className="-ml-4 size-3 text-muted-foreground" />
            </label>
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/pos">
                <ReceiptText aria-hidden="true" className="size-3.5" />
                New sale
              </Link>
            </Button>
          </>
        }
      />

      <SupabaseNotice />
      {salesQuery.isError && <QueryError error={salesQuery.error} label="Could not load sales" />}
      {productsQuery.isError && <QueryError error={productsQuery.error} label="Could not load the catalogue" />}

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard
          icon={CircleDollarSign}
          title="Total sales"
          value={formatKes(revenue)}
          note={`${range.toLowerCase()} · ${transactions} receipts`}
          color="var(--chart-1)"
        />
        <StatCard
          icon={ReceiptText}
          title="Transactions"
          value={String(transactions)}
          note={revenue ? `average ${formatKes(Math.round(revenue / Math.max(transactions, 1)))}` : "no sales in this period"}
          color="var(--chart-4)"
        />
        <StatCard
          icon={TrendingUp}
          title="Gross profit"
          value={profit === null ? "—" : formatKes(profit)}
          note={profit === null ? "set cost prices to track margin" : "from recorded cost prices"}
          color="var(--chart-2)"
        />
        <StatCard
          icon={PackageCheck}
          title="Products in stock"
          value={String(products.reduce((sum, product) => sum + product.stock, 0))}
          note={`${lowStock.length} need attention`}
          color="var(--chart-3)"
        />
      </section>

      <section
        aria-label="Sales and product categories"
        className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(285px,0.9fr)]"
      >
        <SectionCard
          title="Sales overview"
          description={`Revenue movement · ${range}`}
          action={
            <span className="inline-flex items-center gap-1.5 pt-1 text-[10px] font-medium text-muted-foreground">
              <span aria-hidden="true" className="size-2 rounded-full bg-emerald" />
              Recorded revenue
            </span>
          }
          bodyClassName="px-2 pb-4 pt-3 sm:px-4 sm:pb-5"
          footer={`Maximum bucket: ${formatKes(Math.max(...series.values, 0))}`}
        >
          {salesQuery.isLoading ? (
            <QueryLoading label="Loading sales..." />
          ) : revenue === 0 ? (
            <EmptyState
              title="No sales in this period"
              description="Complete a sale in the point of sale to see revenue trends here."
              action={
                <Button asChild size="sm" className="mt-2 h-8">
                  <Link to="/pos">Open point of sale</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex h-[162px] items-stretch gap-2 sm:h-[205px]">
                <div
                  aria-hidden="true"
                  className="flex w-12 shrink-0 flex-col justify-between pb-1 text-right text-[9px] text-muted-foreground"
                >
                  <span>{formatKes(Math.max(...series.values, 0))}</span>
                  <span>{formatKes(Math.round(Math.max(...series.values, 0) / 2))}</span>
                  <span>0</span>
                </div>
                <div className="min-w-0 flex-1">
                  <AreaTrend values={series.values} label={`Revenue over ${range.toLowerCase()}`} />
                </div>
              </div>
              <div
                aria-hidden="true"
                className="ml-[54px] mt-2 flex justify-between text-[9px] text-muted-foreground sm:text-[10px]"
              >
                {series.labels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Sales by category"
          description="Revenue mix in this period"
          footer="Calculated from receipt lines."
        >
          {categoryMix.length ? (
            <>
              <DistributionBar segments={categoryMix} label="Sales split by product category" />
              <ul className="mt-4 space-y-[15px]">
                {categoryMix.map((category) => (
                  <li key={category.name} className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-[9px] shrink-0 rounded-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate text-[11px] text-muted-foreground">{category.name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11px] font-medium text-card-foreground">
                        {formatKes(category.amount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{category.percent}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState title="No category sales yet" description="Category totals appear once receipts exist." />
          )}
        </SectionCard>
      </section>

      <section aria-label="Recent sales and stock alerts" className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5">
            <div>
              <h3 className="text-[14px] font-semibold text-card-foreground">Recent transactions</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Latest receipts recorded at the counter</p>
            </div>
            <Button asChild variant="ghost" className="h-8 shrink-0 gap-1.5 px-2 text-[11px] font-medium text-primary">
              <Link to="/sales">
                View all
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </Button>
          </div>
          {salesQuery.isLoading ? (
            <div className="px-4 pb-4 sm:px-5">
              <QueryLoading label="Loading receipts..." />
            </div>
          ) : !sales.length ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState title="No receipts yet" description="Sales recorded in the POS will show up here." />
            </div>
          ) : (
            <DataTable
              rows={sales.slice(0, 5)}
              getRowId={(sale) => sale.id}
              caption="Recent receipts"
              minWidth="560px"
              columns={[
                {
                  key: "receipt",
                  header: "RECEIPT",
                  render: (sale) => <span className="whitespace-nowrap font-medium text-primary">{sale.receipt}</span>,
                },
                {
                  key: "customer",
                  header: "CUSTOMER",
                  render: (sale) => <span className="whitespace-nowrap">{sale.customer_name}</span>,
                },
                {
                  key: "method",
                  header: "PAYMENT",
                  render: (sale) => (
                    <span className="whitespace-nowrap rounded-[5px] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {sale.payment_method}
                    </span>
                  ),
                },
                {
                  key: "amount",
                  header: "AMOUNT",
                  align: "right",
                  render: (sale) => (
                    <span className="whitespace-nowrap font-semibold">{formatKes(Number(sale.total))}</span>
                  ),
                },
                {
                  key: "date",
                  header: "DATE",
                  align: "right",
                  render: (sale) => (
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {formatDate(sale.created_at)}
                    </span>
                  ),
                },
              ]}
            />
          )}
          <div className="border-t border-border px-5 py-[11px]">
            <span className="text-[10px] text-muted-foreground">Recorded transactions from Supabase</span>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5">
            <div>
              <h3 className="text-[14px] font-semibold text-card-foreground">Low stock alerts</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Products at or below their reorder level</p>
            </div>
            <span className="inline-flex h-6 items-center gap-1 rounded-md bg-amber/10 px-2 text-[10px] font-medium text-amber">
              <FileWarning aria-hidden="true" className="size-3" />
              {lowStock.length} items
            </span>
          </div>
          {productsQuery.isLoading ? (
            <div className="px-4 pb-4 sm:px-5">
              <QueryLoading label="Loading stock..." />
            </div>
          ) : !lowStock.length ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState title="Stock levels look healthy" description="No product is at its reorder level right now." />
            </div>
          ) : (
            <DataTable
              rows={lowStock}
              getRowId={(product) => product.id}
              caption="Products that need restocking"
              minWidth="440px"
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
                        <span className="size-9 shrink-0 rounded-md border border-border bg-muted" />
                      )}
                      <span className="max-w-[150px] truncate font-medium">{product.title}</span>
                    </span>
                  ),
                },
                {
                  key: "sku",
                  header: "SKU",
                  render: (product) => (
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">{product.sku}</span>
                  ),
                },
                {
                  key: "stock",
                  header: "STOCK",
                  align: "right",
                  render: (product) => (
                    <span className="whitespace-nowrap">
                      <span className={`font-semibold ${product.stock === 0 ? "text-destructive" : "text-amber"}`}>
                        {product.stock}
                      </span>
                      <span className="text-[10px] text-muted-foreground"> / {product.reorderLevel} min</span>
                    </span>
                  ),
                },
                {
                  key: "price",
                  header: "PRICE",
                  align: "right",
                  render: (product) => <span className="whitespace-nowrap">{formatKes(product.price)}</span>,
                },
              ]}
            />
          )}
          <div className="border-t border-border px-5 py-[11px]">
            <Button asChild variant="link" className="h-auto p-0 text-[10px] font-medium">
              <Link to="/inventory">
                Open inventory
                <ArrowRight aria-hidden="true" className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </section>
      </section>

      <section
        aria-label="Payments, movements, and business information"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <SectionCard
          title="Payment methods"
          description={`${formatKes(revenue)} · ${range}`}
          action={
            <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
              <CircleDollarSign aria-hidden="true" className="size-4" />
            </span>
          }
          footer="Share of recorded takings in this period."
        >
          {paymentMix.length ? (
            <ul className="space-y-3">
              {paymentMix.map((item) => (
                <ProgressRow key={item.name} label={item.name} percent={item.percent} color={item.color} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No payments yet" description="Payment mix appears once sales are recorded." />
          )}
        </SectionCard>

        <SectionCard title="Stock movements" description="Latest changes in the inventory" footer="Audit trail from Supabase.">
          {movementsQuery.isLoading ? (
            <QueryLoading label="Loading movements..." />
          ) : !movementsQuery.data?.length ? (
            <EmptyState title="No movements yet" description="Sales and stock counts will appear here." />
          ) : (
            <ul className="space-y-4">
              {movementsQuery.data.map((movement) => (
                <li key={movement.id} className="flex gap-3">
                  <span
                    className="mt-[5px] flex size-[9px] shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: movement.quantity < 0 ? "var(--chart-5)" : "var(--chart-2)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-[1.55] text-card-foreground">
                      <span className="font-semibold">{movement.movement_type}</span> ·{" "}
                      <span className="truncate">{movement.product_title}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity} units ·{" "}
                      {movement.reference ?? "no reference"}
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground">{formatDate(movement.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <aside
          aria-label="Business status"
          className="flex min-h-40 flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
              <ShieldCheck aria-hidden="true" className="size-[17px]" />
            </span>
            <span className="flex h-6 items-center gap-1.5 rounded-md bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <Check aria-hidden="true" className="size-3" />
              Connected
            </span>
          </div>
          <div className="mt-5">
            <p className="font-display text-[16px] font-semibold text-card-foreground">
              {settings?.business_name ?? "Samul Bikers POS"}
            </p>
            <p className="mt-1.5 max-w-[280px] text-[11px] leading-[1.6] text-muted-foreground">
              {settings
                ? `${settings.address_line1}, ${settings.city}. ${settings.phone}`
                : "Point of sale and stock management for Samul Bikers, Nairobi."}
            </p>
            {settings && (
              <p className="mt-2 text-[10px] text-muted-foreground">{settings.email}</p>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
