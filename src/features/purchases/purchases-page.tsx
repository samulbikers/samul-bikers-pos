import { ClipboardList, PackageCheck, Truck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { samplePurchaseOrders } from "@/data/sample/operations";
import { formatKes } from "@/lib/format";

const statusOptions = ["All statuses", "Draft", "Ordered", "In transit", "Received", "Cancelled"] as const;

export function PurchasesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(statusOptions[0]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return samplePurchaseOrders.filter((order) => {
      const matchesQuery = !needle || `${order.reference} ${order.supplier}`.toLowerCase().includes(needle);
      const matchesStatus = status === statusOptions[0] || order.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const openValue = samplePurchaseOrders
    .filter((order) => order.status === "Ordered" || order.status === "In transit")
    .reduce((sum, order) => sum + order.amount, 0);
  const received = samplePurchaseOrders.filter((order) => order.status === "Received").length;
  const inTransit = samplePurchaseOrders.filter((order) => order.status === "In transit").length;

  return (
    <>
      <PageHeader
        title="Purchases"
        description="Purchase orders raised with suppliers, from draft through to goods received."
        meta={<PreviewBadge />}
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.info("Purchase order drafts are disabled in the preview workspace.")}
          >
            <ClipboardList aria-hidden="true" className="size-3.5" />
            Raise purchase order
          </Button>
        }
      />

      <section aria-label="Purchases summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={ClipboardList} title="Open orders" value={String(samplePurchaseOrders.length - received)} note="not yet received" color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Committed spend" value={formatKes(openValue)} note="ordered or in transit" color="var(--chart-2)" />
        <StatCard icon={Truck} title="In transit" value={String(inTransit)} note="expected this week" color="var(--chart-4)" />
        <StatCard icon={PackageCheck} title="Received" value={String(received)} note="sample deliveries" color="var(--chart-3)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Purchase orders</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Quantities and values are illustrative.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search purchase orders" placeholder="Search PO or supplier" className="w-full sm:w-64" />
          <FilterSelect label="Filter by order status" value={status} onChange={setStatus} options={statusOptions} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.success("Reminder sent to supplier", { description: "Sample message queued for the selected vendor." })}
          >
            <Truck aria-hidden="true" className="size-3.5" />
            Chase delivery
          </Button>
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} orders</span>
        </Toolbar>
        <DataTable
          rows={rows}
          getRowId={(order) => order.id}
          emptyMessage="No purchase orders match these filters."
          caption="Purchase orders"
          minWidth="820px"
          columns={[
            { key: "reference", header: "REFERENCE", render: (order) => <span className="whitespace-nowrap font-medium text-primary">{order.reference}</span> },
            { key: "supplier", header: "SUPPLIER", render: (order) => <span className="block max-w-[200px] truncate">{order.supplier}</span> },
            { key: "ordered", header: "ORDERED", render: (order) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{order.orderedOn}</span> },
            { key: "expected", header: "EXPECTED", render: (order) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{order.expectedOn}</span> },
            { key: "items", header: "ITEMS", align: "right", render: (order) => <span className="whitespace-nowrap">{order.items}</span> },
            { key: "amount", header: "AMOUNT", align: "right", render: (order) => <span className="whitespace-nowrap font-semibold">{formatKes(order.amount)}</span> },
            { key: "status", header: "STATUS", align: "right", render: (order) => <StatusBadge status={order.status} /> },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Preview procurement · Orders are not sent to suppliers
        </div>
      </section>
    </>
  );
}
