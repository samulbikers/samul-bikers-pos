import { Banknote, CircleDollarSign, ReceiptText, RotateCcw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { PaymentBadge, StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSales } from "@/lib/supabase/queries";
import { useRefundSale } from "@/lib/supabase/mutations";
import type { DbSale } from "@/lib/supabase/types";
import { formatDate, formatKes } from "@/lib/format";

const paymentOptions = ["All methods", "M-Pesa", "Cash", "Card"] as const;
const statusOptions = ["All statuses", "Paid", "Part paid", "Refunded"] as const;

export function SalesPage() {
  const salesQuery = useSales(200);
  const refundSale = useRefundSale();

  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<string>(paymentOptions[0]);
  const [status, setStatus] = useState<string>(statusOptions[0]);
  const [selected, setSelected] = useState<DbSale | null>(null);

  const sales = salesQuery.data ?? [];

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sales.filter((sale) => {
      const matchesQuery =
        !needle || `${sale.receipt} ${sale.customer_name} ${sale.cashier}`.toLowerCase().includes(needle);
      const matchesMethod = method === paymentOptions[0] || sale.payment_method === method;
      const matchesStatus = status === statusOptions[0] || sale.status === status;
      return matchesQuery && matchesMethod && matchesStatus;
    });
  }, [sales, query, method, status]);

  const takings = sales
    .filter((sale) => sale.status !== "Refunded")
    .reduce((sum, sale) => sum + Number(sale.total), 0);
  const refunds = sales
    .filter((sale) => sale.status === "Refunded")
    .reduce((sum, sale) => sum + Number(sale.total), 0);

  const handleRefund = async (sale: DbSale) => {
    try {
      await refundSale.mutateAsync(sale.id);
      toast.success(`Receipt ${sale.receipt} refunded`, { description: "Stock has been returned." });
      setSelected(null);
    } catch (error) {
      toast.error("Could not refund this receipt", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Sales register"
        description="Every receipt recorded through the POS, with refunds flagged."
        meta={
          salesQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              {sales.length} receipts in Supabase
            </span>
          ) : null
        }
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

      <SupabaseNotice />
      {salesQuery.isError && <QueryError error={salesQuery.error} label="Could not load sales" />}

      <section aria-label="Sales summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={CircleDollarSign} title="Net takings" value={formatKes(takings)} note="excludes refunded receipts" color="var(--chart-1)" />
        <StatCard icon={ReceiptText} title="Receipts issued" value={String(sales.length)} note="recorded sales" color="var(--chart-3)" />
        <StatCard
          icon={Banknote}
          title="Average basket"
          value={sales.length ? formatKes(Math.round(takings / sales.length)) : "—"}
          note="per receipt"
          color="var(--chart-2)"
        />
        <StatCard icon={RotateCcw} title="Refunds" value={formatKes(refunds)} note="returned to customers" color="var(--chart-5)" trend="down" />
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

        {salesQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading receipts..." />
          </div>
        ) : !sales.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No sales recorded yet"
              description="Ring up your first sale in the point of sale and the receipt will appear here."
              action={
                <Button asChild size="sm" className="mt-2 h-8 gap-1.5">
                  <Link to="/pos">Open point of sale</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(sale) => sale.id}
            emptyMessage="No receipts match these filters."
            caption="Recorded receipts"
            minWidth="780px"
            columns={[
              {
                key: "receipt",
                header: "RECEIPT",
                render: (sale) => (
                  <button
                    type="button"
                    onClick={() => setSelected(sale)}
                    className="whitespace-nowrap font-medium text-primary hover:underline"
                  >
                    {sale.receipt}
                  </button>
                ),
              },
              {
                key: "date",
                header: "DATE",
                render: (sale) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {formatDate(sale.created_at)}
                  </span>
                ),
              },
              {
                key: "customer",
                header: "CUSTOMER",
                render: (sale) => <span className="whitespace-nowrap">{sale.customer_name}</span>,
              },
              {
                key: "cashier",
                header: "CASHIER",
                render: (sale) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{sale.cashier}</span>
                ),
              },
              {
                key: "method",
                header: "PAYMENT",
                render: (sale) => <PaymentBadge method={sale.payment_method} />,
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
                key: "status",
                header: "STATUS",
                align: "right",
                render: (sale) => <StatusBadge status={sale.status} />,
              },
            ]}
          />
        )}
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Receipts are stored in Supabase · Refunds return stock automatically
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {selected?.receipt} · {selected && formatKes(Number(selected.total))}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              {selected && formatDate(selected.created_at)} · {selected?.cashier} · {selected?.payment_method}
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border rounded-md border border-border">
            {selected?.pos_sale_items?.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[11px]">
                <span className="min-w-0">
                  <span className="block truncate text-card-foreground">{item.product_title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.quantity} × {formatKes(Number(item.unit_price))}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-card-foreground">
                  {formatKes(Number(item.line_total))}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-card-foreground">{selected && formatKes(Number(selected.subtotal))}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="font-medium text-card-foreground">{selected && formatKes(Number(selected.discount))}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">VAT (16%)</dt>
              <dd className="font-medium text-card-foreground">{selected && formatKes(Number(selected.vat))}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Customer</dt>
              <dd className="font-medium text-card-foreground">{selected?.customer_name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{selected && <StatusBadge status={selected.status} />}</dd>
            </div>
          </dl>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setSelected(null)} className="h-9">
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-9 gap-1.5"
              disabled={!selected || selected.status === "Refunded" || refundSale.isPending}
              onClick={() => selected && handleRefund(selected)}
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              {refundSale.isPending ? "Refunding..." : "Refund receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
