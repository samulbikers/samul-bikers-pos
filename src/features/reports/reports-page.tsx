import { Download, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AreaTrend, GroupedBars, ProgressRow } from "@/components/data/charts";
import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { monthlyRevenue, topSellingProducts } from "@/data/sample/operations";
import { paymentMethods, salesByCategory, weekDays } from "@/features/dashboard/dashboard-data";
import { formatKes, formatKesCompact } from "@/lib/format";

const periodOptions = ["Last 7 days", "Last 30 days", "This quarter", "Year to date"] as const;

export function ReportsPage() {
  const [period, setPeriod] = useState<string>(periodOptions[1]);

  const revenueTotal = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
  const profitTotal = monthlyRevenue.reduce((sum, month) => sum + month.profit, 0);
  const expenseTotal = monthlyRevenue.reduce((sum, month) => sum + month.expenses, 0);

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Trading trends, margins and the products doing the heavy lifting."
        meta={
          <>
            <PreviewBadge label="PREVIEW · SAMPLE ANALYTICS" />
            <span className="text-[10px] text-muted-foreground">Updated 19 Nov 2026 · 09:45</span>
          </>
        }
        actions={
          <>
            <FilterSelect label="Report period" value={period} onChange={setPeriod} options={periodOptions} />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5"
              onClick={() => toast.info("Report export is disabled in the preview workspace.")}
            >
              <Download aria-hidden="true" className="size-3.5" />
              Export
            </Button>
          </>
        }
      />

      <section aria-label="Report summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={TrendingUp} title="Revenue" value={formatKesCompact(revenueTotal)} change="+12.4%" note="trailing six months" color="var(--chart-1)" />
        <StatCard icon={TrendingUp} title="Gross profit" value={formatKesCompact(profitTotal)} change="+8.9%" note="sample cost basis" color="var(--chart-2)" />
        <StatCard icon={TrendingUp} title="Operating costs" value={formatKesCompact(expenseTotal)} change="+3.1%" note="rent, salaries, utilities" color="var(--chart-4)" trend="down" />
        <StatCard icon={TrendingUp} title="Net margin" value={`${Math.round((profitTotal / revenueTotal) * 100)}%`} note="six-month average" color="var(--chart-3)" />
      </section>

      <SectionCard
        title="Revenue, profit and costs"
        description={`Monthly comparison · ${period.toLowerCase()}`}
        action={
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />Revenue</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />Profit</span>
            <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-4)" }} />Costs</span>
          </div>
        }
        footer="Sample analytics · Figures are illustrative"
        bodyClassName="px-2 pb-4 pt-3 sm:px-4 sm:pb-5"
      >
        <div className="h-[210px]">
          <GroupedBars
            label="Revenue, profit and costs by month"
            data={monthlyRevenue.map((month) => ({
              label: month.month,
              values: [month.revenue, month.profit, month.expenses],
            }))}
            series={[
              { name: "Revenue", color: "var(--chart-1)" },
              { name: "Profit", color: "var(--chart-2)" },
              { name: "Costs", color: "var(--chart-4)" },
            ]}
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Top selling products</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Ranked by units sold in the sample period.</p>
          </div>
          <DataTable
            rows={topSellingProducts}
            getRowId={(product) => product.name}
            caption="Top selling products"
            minWidth="460px"
            columns={[
              { key: "name", header: "PRODUCT", render: (product) => <span className="block max-w-[240px] truncate font-medium">{product.name}</span> },
              { key: "units", header: "UNITS", align: "right", render: (product) => <span>{product.units}</span> },
              { key: "revenue", header: "REVENUE", align: "right", render: (product) => <span className="whitespace-nowrap font-semibold">{formatKes(product.revenue)}</span> },
            ]}
          />
          <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
            Ranking uses sample sales history.
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <SectionCard title="Payment mix" description="Share of sample takings" footer="Cash, mobile and card in preview.">
            <ul className="space-y-3">
              {paymentMethods.map((item) => (
                <ProgressRow key={item.name} label={item.name} percent={item.percent} color={item.color} />
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Category mix" description="Revenue by product group" footer="Illustrative category split.">
            <ul className="space-y-3">
              {salesByCategory.map((category) => (
                <ProgressRow
                  key={category.name}
                  label={category.name}
                  percent={category.percent}
                  color={category.color}
                  value={formatKes(category.amount)}
                />
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Weekly revenue rhythm" description="Average daily takings across the sample week" footer="Sample daily distribution.">
        <div className="h-[180px] pt-2">
          <AreaTrend values={[42, 55, 48, 72, 88, 96, 61]} label="Illustrative weekly revenue rhythm" />
        </div>
        <div aria-hidden="true" className="mt-2 flex justify-between text-[9px] text-muted-foreground sm:text-[10px]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
