import { Link } from "@tanstack/react-router";
import { Banknote, CircleDollarSign, ReceiptText, RotateCcw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { PaymentBadge, StatusBadge } from "@/components/data/status-badge";
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
import { sampleSales, type Sale } from "@/data/sample/operations";
import { formatKes } from "@/lib/format";

const paymentOptions = ["All methods", "M-Pesa", "Cash", "Card"] as const;
const statusOptions = ["All statuses", "Paid", "Part paid", "Refunded"] as const;

export function SalesPage() {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<string>(paymentOptions[0]);
  const [status, setStatus] = useState<string>(statusOptions[0]);
  const [selected, setSelected] = useState<Sale | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleSales.filter((sale) => {
      const matchesQuery =
        !needle || `${sale.receipt} ${sale.customer} ${sale.cashier}`.toLowerCase().includes(needle);
      const matchesMethod = method === paymentOptions[0] || sale.method === method;
      const matchesStatus = status === statusOptions[0] || sale.status === status;
      return matchesQuery && matchesMethod && matchesStatus;
    });
  }, [query, method, status]);

  const takings = sampleSales
    .filter((sale) => sale.status !== "Refunded")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const refunds = sampleSales
    .filter((sale) => sale.status === "Refunded")
    .reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <>
      <PageHeader
        title="Sales register"
        description="Every receipt captured at the counter, with refunds and part payments flagged."
        meta={<PreviewBadge />}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
              <Link to="/reports">
                <TrendingUp aria-hidden="true" className="size-3.5" />
                Sales report
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9 gap-1.5">
              <Link to="/pos">
                <ReceiptText aria-hidden="true" className="size-3.5" />
                New sale
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Sales summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={CircleDollarSign} title="Net takings" value={formatKes(takings)} change="+9.4%" note="vs previous period" color="var(--chart-1)" />
        <StatCard icon={ReceiptText} title="Receipts issued" value={String(sampleSales.length)} change="+4.1%" note="sample receipts" color="var(--chart-3)" />
        <StatCard icon={Banknote} title="Average basket" value={formatKes(Math.round(takings / sampleSales.length))} change="+2.6%" note="per receipt" color="var(--chart-2)" />
        <StatCard icon={RotateCcw} title="Refunds" value={formatKes(refunds)} note="1 sample refund" color="var(--chart-5)" trend="down" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Receipts</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Select a receipt to inspect the lines sold.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search receipts" placeholder="Search receipt, customer or cashier" className="w-full sm:w-72" />
          <FilterSelect label="Payment method" value={method} onChange={setMethod} options={paymentOptions} />
          <FilterSelect label="Receipt status" value={status} onChange={setStatus} options={statusOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} shown</span>
        </Toolbar>
        <DataTable
          rows={rows}
          getRowId={(sale) => sale.id}
          emptyMessage="No receipts match these filters."
          caption="Sample receipts"
          minWidth="760px"
          columns={[
            {
              key: "receipt",
              header: "RECEIPT",
              render: (sale) => (
                <button type="button" onClick={() => setSelected(sale)} className="whitespace-nowrap font-medium text-primary hover:underline">
                  {sale.receipt}
                </button>
              ),
            },
            {
              key: "date",
              header: "DATE",
              render: (sale) => (
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {sale.date} · {sale.time}
                </span>
              ),
            },
            { key: "customer", header: "CUSTOMER", render: (sale) => <span className="whitespace-nowrap">{sale.customer}</span> },
            { key: "cashier", header: "CASHIER", render: (sale) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{sale.cashier}</span> },
            { key: "method", header: "PAYMENT", render: (sale) => <PaymentBadge method={sale.method} /> },
            { key: "amount", header: "AMOUNT", align: "right", render: (sale) => <span className="whitespace-nowrap font-semibold">{formatKes(sale.amount)}</span> },
            { key: "status", header: "STATUS", align: "right", render: (sale) => <StatusBadge status={sale.status} /> },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Illustrative receipts · Not recorded transactions
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{selected?.receipt} · {selected && formatKes(selected.amount)}</DialogTitle>
            <DialogDescription className="text-[11px]">
              {selected?.date} at {selected?.time} · {selected?.cashier} · {selected?.method}
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border rounded-md border border-border">
            {selected?.lines.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-3 px-3 py-2 text-[11px]">
                <span className="min-w-0">
                  <span className="block truncate text-card-foreground">{line.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {line.quantity} × {formatKes(line.price)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-card-foreground">
                  {formatKes(line.quantity * line.price)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-card-foreground">{selected?.customer}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Status</span>
            {selected && <StatusBadge status={selected.status} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
