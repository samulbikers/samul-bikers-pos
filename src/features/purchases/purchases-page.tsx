import { ClipboardList, PackageCheck, Truck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { usePurchaseOrders } from "@/lib/supabase/queries";
import { formatDate, formatKes } from "@/lib/format";

const statusOptions = ["All statuses", "Draft", "Ordered", "In transit", "Received", "Cancelled"] as const;

export function PurchasesPage() {
  const ordersQuery = usePurchaseOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(statusOptions[0]);

  const orders = ordersQuery.data ?? [];

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !needle || `${order.reference} ${order.supplier_name}`.toLowerCase().includes(needle);
      const matchesStatus = status === statusOptions[0] || order.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const openValue = orders
    .filter((order) => order.status === "Ordered" || order.status === "In transit")
    .reduce((sum, order) => sum + Number(order.amount), 0);
  const received = orders.filter((order) => order.status === "Received").length;
  const inTransit = orders.filter((order) => order.status === "In transit").length;

  return (
    <>
      <PageHeader
        title="Purchases"
        description="Purchase orders stored in Supabase, from draft through to goods received."
        meta={
          ordersQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live from Supabase
            </span>
          ) : null
        }
      />

      <SupabaseNotice />
      {ordersQuery.isError && <QueryError error={ordersQuery.error} label="Could not load purchase orders" />}

      <section aria-label="Purchases summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ClipboardList} title="Open orders" value={String(orders.length - received)} note="not yet received" color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Committed spend" value={formatKes(openValue)} note="ordered or in transit" color="var(--chart-2)" />
        <StatCard icon={Truck} title="In transit" value={String(inTransit)} note="expected soon" color="var(--chart-4)" />
        <StatCard icon={PackageCheck} title="Received" value={String(received)} note="completed orders" color="var(--chart-3)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Purchase orders</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Quantities and values come from the database.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search purchase orders" placeholder="Search PO or supplier" className="w-full sm:w-64" />
          <FilterSelect label="Filter by order status" value={status} onChange={setStatus} options={statusOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} orders</span>
        </Toolbar>

        {ordersQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading purchase orders..." />
          </div>
        ) : !orders.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No purchase orders yet"
              description="Orders added to pos_purchase_orders will be tracked here."
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(order) => order.id}
            emptyMessage="No purchase orders match these filters."
            caption="Purchase orders"
            minWidth="820px"
            columns={[
              {
                key: "reference",
                header: "REFERENCE",
                render: (order) => <span className="whitespace-nowrap font-medium text-primary">{order.reference}</span>,
              },
              {
                key: "supplier",
                header: "SUPPLIER",
                render: (order) => <span className="block max-w-[200px] truncate">{order.supplier_name}</span>,
              },
              {
                key: "ordered",
                header: "ORDERED",
                render: (order) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{formatDate(order.ordered_on)}</span>
                ),
              },
              {
                key: "expected",
                header: "EXPECTED",
                render: (order) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                    {order.expected_on ? formatDate(order.expected_on) : "—"}
                  </span>
                ),
              },
              { key: "items", header: "ITEMS", align: "right", render: (order) => <span className="whitespace-nowrap">{order.items}</span> },
              {
                key: "amount",
                header: "AMOUNT",
                align: "right",
                render: (order) => <span className="whitespace-nowrap font-semibold">{formatKes(Number(order.amount))}</span>,
              },
              {
                key: "status",
                header: "STATUS",
                align: "right",
                render: (order) => <StatusBadge status={order.status} />,
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
