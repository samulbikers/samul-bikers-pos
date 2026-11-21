import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleDollarSign, Download, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { PaymentBadge, StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/branches/branch-store";
import { formatKes, formatNairobiDate } from "@/lib/format";
import {
  buildZReport,
  formatReportDate,
  nairobiDateKey,
} from "@/lib/reports/z-report";
import { downloadZReportPdf } from "@/lib/reports/z-report-pdf";
import { useSales, useSiteSettings } from "@/lib/supabase/queries";
import type { DbSale } from "@/lib/supabase/types";

function isToday(value: string, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" });
  return formatter.format(new Date(value)) === formatter.format(now);
}

export function CashierDashboard() {
  const { user } = useAuth();
  const branches = useBranches();
  const salesQuery = useSales(300);
  const settingsQuery = useSiteSettings();
  const now = useMemo(() => new Date(), []);

  const mySales = useMemo(() => {
    const name = user?.name.trim().toLowerCase() ?? "";
    return (salesQuery.data ?? []).filter(
      (sale) => sale.status !== "Refunded" && sale.cashier.trim().toLowerCase() === name && isToday(sale.created_at, now),
    );
  }, [salesQuery.data, user, now]);

  const revenue = mySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const average = mySales.length ? Math.round(revenue / mySales.length) : 0;
  const recent = mySales.slice(0, 8);

  const downloadToday = () => {
    if (!user) return;
    const branch = branches.find((entry) => entry.id === user.branchId)?.name;
    const report = buildZReport({
      cashier: user.name,
      date: nairobiDateKey(now),
      sales: salesQuery.data ?? [],
      branch,
    });
    downloadZReportPdf(report, settingsQuery.data?.business_name ?? "Samul Bikers");
    toast.success("Z report downloaded", { description: `${user.name} · ${formatReportDate(report.date)} · PDF` });
  };

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Your shift at a glance. Cashier access is limited to the point of sale and this summary."
        meta={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-muted-foreground">
            <ShoppingCart aria-hidden="true" className="size-3" />
            Till only · {settingsQuery.data?.business_name ?? "Samul Bikers"}
          </span>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={downloadToday}>
              <Download aria-hidden="true" className="size-3.5" />
              Download Z report PDF
            </Button>
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/pos">
                <ReceiptText aria-hidden="true" className="size-3.5" />
                Open point of sale
              </Link>
            </Button>
          </>
        }
      />

      <SupabaseNotice />
      {salesQuery.isError && <QueryError error={salesQuery.error} label="Could not load your sales" />}

      <section aria-label="My shift summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:gap-[14px]">
        <StatCard
          icon={CircleDollarSign}
          title="My sales today"
          value={formatKes(revenue)}
          note="receipts you completed"
          color="var(--chart-1)"
        />
        <StatCard
          icon={ReceiptText}
          title="Receipts today"
          value={String(mySales.length)}
          note="on your till"
          color="var(--chart-4)"
        />
        <StatCard
          icon={Wallet}
          title="Average basket"
          value={average ? formatKes(average) : "—"}
          note="per receipt today"
          color="var(--chart-2)"
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5">
          <div>
            <h3 className="text-[14px] font-semibold text-card-foreground">My recent receipts</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Only sales recorded under your name are shown.</p>
          </div>
          <Button asChild variant="ghost" className="h-8 shrink-0 gap-1.5 px-2 text-[11px] font-medium text-primary">
            <Link to="/pos">
              New sale
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </Button>
        </div>

        {salesQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading your receipts..." />
          </div>
        ) : recent.length ? (
          <DataTable
            rows={recent}
            getRowId={(sale) => sale.id}
            caption="My recent receipts"
            minWidth="620px"
            columns={[
              {
                key: "receipt",
                header: "RECEIPT",
                render: (sale: DbSale) => (
                  <span className="min-w-0">
                    <span className="block font-medium">{sale.receipt}</span>
                    <span className="block text-[10px] text-muted-foreground">{sale.customer_name}</span>
                  </span>
                ),
              },
              {
                key: "time",
                header: "TIME",
                render: (sale: DbSale) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {formatNairobiDate(new Date(sale.created_at))}
                  </span>
                ),
              },
              {
                key: "method",
                header: "PAYMENT",
                render: (sale: DbSale) => <PaymentBadge method={sale.payment_method} />,
              },
              {
                key: "status",
                header: "STATUS",
                render: (sale: DbSale) => <StatusBadge status={sale.status} />,
              },
              {
                key: "total",
                header: "TOTAL",
                align: "right",
                render: (sale: DbSale) => (
                  <span className="whitespace-nowrap font-semibold">{formatKes(Number(sale.total))}</span>
                ),
              },
            ]}
          />
        ) : (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No receipts yet today"
              description="When you complete a sale at the till it will appear here."
              action={
                <Button asChild size="sm" className="mt-2 h-8">
                  <Link to="/pos">Go to point of sale</Link>
                </Button>
              }
            />
          </div>
        )}
      </section>
    </>
  );
}
