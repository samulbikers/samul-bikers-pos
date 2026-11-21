import { CalendarDays, Download, FileText, Printer, ReceiptText, Users, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { ProgressRow } from "@/components/data/charts";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { PaymentBadge, StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCashiers } from "@/lib/auth/roles";
import { useBranches } from "@/lib/branches/branch-store";
import { formatKes, formatNairobiDate } from "@/lib/format";
import {
  buildZReport,
  formatReportDate,
  nairobiDateKey,
} from "@/lib/reports/z-report";
import { downloadZReportPdf, printZReport } from "@/lib/reports/z-report-pdf";
import { useSales, useSiteSettings } from "@/lib/supabase/queries";
import type { DbSale } from "@/lib/supabase/types";

export function ZReportPage({ initialCashier }: { initialCashier?: string | undefined } = {}) {
  const { user, accounts } = useAuth();
  const branches = useBranches();
  const salesQuery = useSales(1000);
  const settingsQuery = useSiteSettings();
  const [selected, setSelected] = useState(initialCashier ?? "");
  const [date, setDate] = useState(() => nairobiDateKey(new Date()));

  useEffect(() => {
    if (initialCashier) setSelected(initialCashier);
  }, [initialCashier]);

  const isAdmin = user ? canManageCashiers(user.role) : false;
  const cashierAccounts = useMemo(
    () => accounts.filter((account) => account.role === "cashier"),
    [accounts],
  );
  const cashierNames = useMemo(() => {
    const names = cashierAccounts.map((account) => account.name);
    if (user?.role === "cashier" && !names.includes(user.name)) names.unshift(user.name);
    return names;
  }, [cashierAccounts, user]);

  const cashierName = isAdmin ? selected || cashierNames[0] || "" : (user?.name ?? "");
  const cashierAccount = cashierAccounts.find((account) => account.name === cashierName);
  const branchName = branches.find((branch) => branch.id === cashierAccount?.branchId)?.name ?? "All branches";

  const report = useMemo(
    () =>
      buildZReport({
        cashier: cashierName,
        date,
        sales: salesQuery.data ?? [],
        branch: branchName,
      }),
    [cashierName, date, salesQuery.data, branchName],
  );

  const businessName = settingsQuery.data?.business_name ?? "Samul Bikers";
  const paymentTotal = report.payments.reduce((sum, payment) => sum + payment.amount, 0);

  const download = () => {
    if (!cashierName) {
      toast.error("Choose a cashier before downloading a Z report.");
      return;
    }
    downloadZReportPdf(report, businessName);
    toast.success("Z report downloaded", {
      description: `${cashierName} · ${formatReportDate(report.date)} · PDF`,
    });
  };

  const print = () => {
    if (!cashierName) {
      toast.error("Choose a cashier before printing a Z report.");
      return;
    }
    printZReport(report, businessName);
  };

  return (
    <>
      <PageHeader
        title="Z report"
        description="End-of-day takings for a cashier, ready to download and sign off."
        meta={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-muted-foreground">
            <FileText aria-hidden="true" className="size-3" />
            {isAdmin ? "All cashiers" : "Your report only"}
          </span>
        }
        actions={
          <>
            {isAdmin ? (
              <select
                aria-label="Select cashier"
                value={cashierName}
                onChange={(event) => setSelected(event.target.value)}
                className="h-9 cursor-pointer rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cashierNames.length ? (
                  cashierNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <option value="">No cashiers yet</option>
                )}
              </select>
            ) : null}
            <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[11px] text-muted-foreground">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Business date</span>
              <input
                type="date"
                aria-label="Business date"
                value={date}
                max={nairobiDateKey(new Date())}
                onChange={(event) => setDate(event.target.value || nairobiDateKey(new Date()))}
                className="bg-transparent text-[11px] font-medium text-foreground focus:outline-none"
              />
            </label>
            <Button type="button" size="sm" variant="outline" className="h-9 gap-1.5" onClick={print}>
              <Printer aria-hidden="true" className="size-3.5" />
              Print
            </Button>
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={download}>
              <Download aria-hidden="true" className="size-3.5" />
              Download PDF
            </Button>
          </>
        }
      />

      <SupabaseNotice />
      {salesQuery.isError && <QueryError error={salesQuery.error} label="Could not load sales" />}

      <section aria-label="Z report summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ReceiptText} title="Paid receipts" value={String(report.paidCount)} note={`${report.refundedCount} refunded`} color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Net sales" value={formatKes(report.net)} note={`gross ${formatKes(report.gross)}`} color="var(--chart-2)" />
        <StatCard icon={Users} title="Cashier" value={cashierName || "—"} note={branchName} color="var(--chart-3)" />
        <StatCard icon={FileText} title="Average sale" value={report.paidCount ? formatKes(report.averageBasket) : "—"} note={`VAT ${formatKes(report.vat)}`} color="var(--chart-4)" />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Receipts on this Z report</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {cashierName || "No cashier selected"} · {formatReportDate(report.date)}
            </p>
          </div>
          {salesQuery.isLoading ? (
            <div className="px-4 pb-4 sm:px-5">
              <QueryLoading label="Loading receipts..." />
            </div>
          ) : report.receipts.length ? (
            <DataTable
              rows={report.receipts}
              getRowId={(sale) => sale.id}
              caption="Z report receipts"
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
                title="No receipts on this date"
                description="Choose another date or wait until this cashier records a sale."
              />
            </div>
          )}
          <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
            Download the PDF or print a copy to sign and file.
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <SectionCard title="Payment breakdown" description="Takings by payment method" footer={`${report.paidCount} paid receipts`}>
            {report.payments.length ? (
              <ul className="space-y-3">
                {report.payments.map((payment, index) => (
                  <ProgressRow
                    key={payment.method}
                    label={`${payment.method} · ${payment.receipts}`}
                    percent={paymentTotal ? Math.round((payment.amount / paymentTotal) * 100) : 0}
                    color={`var(--chart-${(index % 5) + 1})`}
                    value={formatKes(payment.amount)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title="No payments yet" description="Payment totals appear once receipts exist." />
            )}
          </SectionCard>

          <SectionCard title="Totals" description="Balancing figures for the drawer" footer="Refunds are reported separately.">
            <dl className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Gross sales</dt>
                <dd className="font-semibold text-card-foreground">{formatKes(report.gross)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Discounts</dt>
                <dd className="font-semibold text-card-foreground">{formatKes(report.discounts)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">VAT</dt>
                <dd className="font-semibold text-card-foreground">{formatKes(report.vat)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="font-medium text-foreground">Net sales</dt>
                <dd className="font-semibold text-foreground">{formatKes(report.net)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Refunds</dt>
                <dd className="font-semibold text-destructive">{formatKes(report.refunds)}</dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
