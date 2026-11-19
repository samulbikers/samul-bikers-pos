import { Link } from "@tanstack/react-router";
import {
  Activity,
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
import { PreviewBadge } from "@/components/data/preview-badge";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { PaymentBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sampleSales } from "@/data/sample/operations";
import {
  dateRanges,
  lowStockProducts,
  overviewByRange,
  paymentMethods,
  previewActivities,
  salesByCategory,
  weekDays,
  type DashboardRange,
} from "@/features/dashboard/dashboard-data";
import { formatKes } from "@/lib/format";
import safetyImage from "@/assets/cat-safety-gear.jpg";
import storageImage from "@/assets/cat-tailboxes.jpg";

type SaleRow = (typeof sampleSales)[number];

const transactionColumns = [
  {
    key: "receipt",
    header: "RECEIPT",
    render: (sale: SaleRow) => (
      <span className="whitespace-nowrap font-medium text-primary">{sale.receipt}</span>
    ),
  },
  {
    key: "customer",
    header: "CUSTOMER",
    render: (sale: SaleRow) => (
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span className="flex size-[25px] items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
          {sale.customer
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")}
        </span>
        <span>{sale.customer}</span>
      </span>
    ),
  },
  {
    key: "method",
    header: "PAYMENT",
    render: (sale: SaleRow) => <PaymentBadge method={sale.method} />,
  },
  {
    key: "amount",
    header: "AMOUNT",
    align: "right" as const,
    render: (sale: SaleRow) => (
      <span className="whitespace-nowrap font-semibold">{formatKes(sale.amount)}</span>
    ),
  },
  {
    key: "time",
    header: "TIME",
    align: "right" as const,
    render: (sale: SaleRow) => (
      <span className="whitespace-nowrap text-[10px] text-muted-foreground">{sale.time}</span>
    ),
  },
];

function SalesOverview({ range }: { range: DashboardRange }) {
  const values = overviewByRange[range].chart;

  return (
    <SectionCard
      title="Sales overview"
      description={`Revenue movement · ${range}`}
      action={
        <span className="inline-flex items-center gap-1.5 pt-1 text-[10px] font-medium text-muted-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-emerald" />
          Preview revenue
        </span>
      }
      bodyClassName="px-2 pb-4 pt-3 sm:px-4 sm:pb-5"
    >
      <div className="flex h-[162px] items-stretch gap-2 sm:h-[205px]">
        <div
          aria-hidden="true"
          className="flex w-12 shrink-0 flex-col justify-between pb-1 text-right text-[9px] text-muted-foreground"
        >
          <span>KES 400k</span>
          <span>KES 300k</span>
          <span>KES 200k</span>
          <span>KES 100k</span>
          <span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <AreaTrend values={values} label={`Illustrative revenue over ${range.toLowerCase()}`} />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="ml-[54px] mt-2 flex justify-between text-[9px] text-muted-foreground sm:text-[10px]"
      >
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </SectionCard>
  );
}

function CategoryOverview() {
  return (
    <SectionCard
      title="Sales by category"
      description="Preview product mix"
      footer="Category totals are illustrative."
    >
      <DistributionBar segments={salesByCategory} label="Sample sales split by product category" />
      <ul className="mt-4 space-y-[15px]">
        {salesByCategory.map((category) => (
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
    </SectionCard>
  );
}

function TransactionsPanel() {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? sampleSales.filter((sale) =>
          `${sale.receipt} ${sale.customer} ${sale.method}`.toLowerCase().includes(needle),
        )
      : sampleSales;
    return showAll ? matches : matches.slice(0, 4);
  }, [query, showAll]);

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h3 className="text-[14px] font-semibold text-card-foreground">Recent transactions</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Latest activity in this sample view</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAll((current) => !current)}
          className="h-8 shrink-0 gap-1.5 px-2 text-[11px] font-medium text-primary"
        >
          {showAll ? "Show less" : "View all"}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search transactions"
          placeholder="Search receipts or customers"
          className="w-full sm:w-64"
        />
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-[11px]">
          <Link to="/sales">
            Open sales register
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </Button>
      </div>
      <DataTable
        columns={transactionColumns}
        rows={rows}
        getRowId={(sale) => sale.id}
        emptyMessage="No sample activity matches this search."
        minWidth="560px"
        caption="Recent sample transactions"
      />
      <div className="border-t border-border px-5 py-[11px]">
        <span className="text-[10px] text-muted-foreground">Illustrative activity · Not recorded transactions</span>
      </div>
    </section>
  );
}

function StockOverview() {
  const rows = lowStockProducts;

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5">
        <div>
          <h3 className="text-[14px] font-semibold text-card-foreground">Low stock alerts</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Illustrative stock levels</p>
        </div>
        <span className="inline-flex h-6 items-center gap-1 rounded-md bg-amber/10 px-2 text-[10px] font-medium text-amber">
          <FileWarning aria-hidden="true" className="size-3" />
          {rows.length} items
        </span>
      </div>
      <DataTable
        minWidth="440px"
        getRowId={(item) => item.sku}
        rows={rows}
        caption="Products that need restocking"
        columns={[
          {
            key: "product",
            header: "PRODUCT",
            render: (item) => (
              <span className="flex items-center gap-2.5">
                <img
                  src={item.photo === "storage" ? storageImage : safetyImage}
                  alt={item.alt}
                  className="size-9 shrink-0 rounded-md border border-border object-cover"
                />
                <span className="max-w-[150px] truncate font-medium">{item.name}</span>
              </span>
            ),
          },
          {
            key: "sku",
            header: "SKU",
            render: (item) => (
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">{item.sku}</span>
            ),
          },
          {
            key: "stock",
            header: "STOCK",
            align: "right",
            render: (item) => (
              <span className="whitespace-nowrap">
                <span className={`font-semibold ${item.remaining <= 3 ? "text-destructive" : "text-amber"}`}>
                  {item.remaining}
                </span>
                <span className="text-[10px] text-muted-foreground"> / {item.total}</span>
              </span>
            ),
          },
          {
            key: "price",
            header: "PRICE",
            align: "right",
            render: (item) => <span className="whitespace-nowrap">{formatKes(item.price)}</span>,
          },
        ]}
      />
      <div className="border-t border-border px-5 py-[11px]">
        <Button asChild variant="link" className="h-auto p-0 text-[10px] font-medium">
          <Link to="/inventory">
            Open inventory
            <ArrowRight aria-hidden="true" className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function PaymentsOverview() {
  const total = paymentMethods.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SectionCard
      title="Payment methods"
      description={`${formatKes(total)} · sample`}
      action={
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
          <CircleDollarSign aria-hidden="true" className="size-4" />
        </span>
      }
      footer="Share of sample takings this week."
    >
      <ul className="space-y-3">
        {paymentMethods.map((item) => (
          <ProgressRow
            key={item.name}
            label={item.name}
            percent={item.percent}
            color={item.color}
            value={`${item.percent}%`}
          />
        ))}
      </ul>
    </SectionCard>
  );
}

function TeamActivity() {
  return (
    <SectionCard
      title="Team activity"
      description="A sample of recent updates"
      action={<Activity aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />}
      footer="Preview only · sample staff actions."
    >
      <ul className="space-y-4">
        {previewActivities.map((item) => (
          <li key={`${item.actor}-${item.time}`} className="flex gap-3">
            <span
              className="mt-[5px] flex size-[9px] shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: item.color }}
            >
              <span className="size-[3px] rounded-full bg-card" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-[1.55] text-card-foreground">
                <span className="font-semibold">{item.actor}</span> {item.action}.
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.detail}</p>
              <p className="mt-1 text-[9px] text-muted-foreground">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("Last 7 days");
  const metrics = overviewByRange[range];

  return (
    <>
      <PageHeader
        title="Welcome back, Samul Bikers Haven"
        description="Here is how the shop is trading in this preview workspace."
        meta={
          <>
            <PreviewBadge />
            <span className="inline-flex h-6 items-center gap-2 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-foreground">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Main branch
            </span>
            <span className="text-[10px] text-muted-foreground">Nairobi, Kenya</span>
          </>
        }
        actions={
          <>
            <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground">
              <span className="sr-only">Sales period</span>
              <FilterSelect
                label="Dashboard date range"
                value={range}
                onChange={(value) => setRange(value as DashboardRange)}
                options={dateRanges}
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

      <section
        aria-label="Key performance indicators"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]"
      >
        <StatCard
          icon={CircleDollarSign}
          title="Total sales"
          value={formatKes(metrics.revenue)}
          change={metrics.change}
          note="vs previous period"
          color="var(--chart-1)"
        />
        <StatCard
          icon={ReceiptText}
          title="Transactions"
          value={String(metrics.transactions)}
          change="8.1%"
          note="vs previous period"
          color="var(--chart-4)"
        />
        <StatCard
          icon={TrendingUp}
          title="Gross profit"
          value={formatKes(metrics.profit)}
          change="6.4%"
          note="sample product costs"
          color="var(--chart-2)"
        />
        <StatCard
          icon={PackageCheck}
          title="Products in stock"
          value="1,286"
          note="Sample inventory · 3 low"
          color="var(--chart-3)"
        />
      </section>

      <section
        aria-label="Sales and product categories"
        className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(285px,0.9fr)]"
      >
        <SalesOverview range={range} />
        <CategoryOverview />
      </section>

      <section aria-label="Recent sales and stock alerts" className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <TransactionsPanel />
        <StockOverview />
      </section>

      <section
        aria-label="Payments, activity, and business information"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <PaymentsOverview />
        <TeamActivity />
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
              Preview workspace
            </span>
          </div>
          <div className="mt-5">
            <p className="font-display text-[16px] font-semibold text-card-foreground">Samul Bikers POS</p>
            <p className="mt-1.5 max-w-[280px] text-[11px] leading-[1.6] text-muted-foreground">
              A business management preview for Samul Bikers Haven, Nairobi, Kenya.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
