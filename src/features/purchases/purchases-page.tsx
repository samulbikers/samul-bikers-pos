import { ClipboardList, PackageCheck, Pencil, Plus, Trash2, Truck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, FormDialog, type FormField, type FormValues } from "@/components/data/form-dialog";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { usePurchaseOrders, useSuppliers } from "@/lib/supabase/queries";
import {
  useCreatePurchaseOrder,
  useDeletePurchaseOrder,
  useUpdatePurchaseOrder,
} from "@/lib/supabase/mutations";
import type { DbPurchaseOrder } from "@/lib/supabase/types";
import { formatDate, formatKes } from "@/lib/format";

const statuses = ["Draft", "Ordered", "In transit", "Received", "Cancelled"] as const;
const statusOptions = ["All statuses", ...statuses] as const;
const today = () => new Date().toISOString().slice(0, 10);

const emptyValues: FormValues = {
  reference: "",
  supplier_name: "",
  status: "Ordered",
  ordered_on: today(),
  expected_on: "",
  items: "1",
  amount: "0",
};

export function PurchasesPage() {
  const ordersQuery = usePurchaseOrders();
  const suppliersQuery = useSuppliers();
  const createOrder = useCreatePurchaseOrder();
  const updateOrder = useUpdatePurchaseOrder();
  const deleteOrder = useDeletePurchaseOrder();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(statusOptions[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbPurchaseOrder | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<DbPurchaseOrder | null>(null);

  const orders = ordersQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ value: supplier.name, label: supplier.name })),
    [suppliers],
  );

  const fields = useMemo<readonly FormField[]>(
    () => [
      { key: "reference", label: "Order reference", placeholder: "PO-0001" },
      supplierOptions.length
        ? { key: "supplier_name", label: "Supplier", type: "select", options: supplierOptions }
        : { key: "supplier_name", label: "Supplier", placeholder: "e.g. Helmet House Kenya" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: statuses.map((entry) => ({ value: entry, label: entry })),
      },
      { key: "ordered_on", label: "Ordered on", type: "date" },
      { key: "expected_on", label: "Expected on", type: "date" },
      { key: "items", label: "Item count", type: "number" },
      { key: "amount", label: "Order value (KES)", type: "number", step: "0.01" },
    ],
    [supplierOptions],
  );

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

  const change = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues({ ...emptyValues, ordered_on: today() });
    setDialogOpen(true);
  };

  const openEdit = (order: DbPurchaseOrder) => {
    setEditing(order);
    setValues({
      reference: order.reference,
      supplier_name: order.supplier_name,
      status: order.status,
      ordered_on: order.ordered_on,
      expected_on: order.expected_on ?? "",
      items: String(order.items),
      amount: String(order.amount),
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!values["reference"]?.trim() || !values["supplier_name"]?.trim()) {
      toast.error("Order reference and supplier are required");
      return;
    }

    const supplier = suppliers.find((entry) => entry.name === values["supplier_name"]);
    const payload = {
      reference: values["reference"].trim(),
      supplier_id: supplier?.id ?? null,
      supplier_name: values["supplier_name"].trim(),
      status: (values["status"] || "Ordered") as DbPurchaseOrder["status"],
      ordered_on: values["ordered_on"] || today(),
      expected_on: values["expected_on"] || null,
      items: Number(values["items"] || 0),
      amount: Number(values["amount"] || 0),
    };

    try {
      if (editing) {
        await updateOrder.mutateAsync({ id: editing.id, ...payload });
        toast.success("Purchase order updated", { description: `${payload.reference} saved to Supabase.` });
      } else {
        await createOrder.mutateAsync(payload);
        toast.success("Purchase order added", { description: `${payload.reference} saved to Supabase.` });
      }
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error("Could not save the purchase order", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteOrder.mutateAsync(deleting.id);
      toast.success("Purchase order deleted", { description: `${deleting.reference} removed from Supabase.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the purchase order", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

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
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-3.5" />
            New purchase order
          </Button>
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
              description="Create your first purchase order to start tracking deliveries."
              action={
                <Button type="button" size="sm" className="mt-2 h-8" onClick={openCreate}>
                  New purchase order
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(order) => order.id}
            emptyMessage="No purchase orders match these filters."
            caption="Purchase orders"
            minWidth="1000px"
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
              {
                key: "actions",
                header: "ACTIONS",
                align: "right",
                render: (order) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => openEdit(order)}>
                      <Pencil aria-hidden="true" className="size-3" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-destructive"
                      onClick={() => setDeleting(order)}
                    >
                      <Trash2 aria-hidden="true" className="size-3" />
                      Delete
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Update purchase order" : "New purchase order"}
        description="Saved to the pos_purchase_orders table in Supabase."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createOrder.isPending || updateOrder.isPending}
        submitLabel={editing ? "Save changes" : "Save order"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete purchase order?"
        description={`Remove ${deleting?.reference ?? "this order"} from Supabase? This cannot be undone.`}
        pending={deleteOrder.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
