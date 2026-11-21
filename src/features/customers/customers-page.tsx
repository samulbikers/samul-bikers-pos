import { ContactRound, Pencil, Plus, Repeat, Trash2, Users, Wallet } from "lucide-react";
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
import { useCustomers, useSales } from "@/lib/supabase/queries";
import {
  useCreateCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/lib/supabase/mutations";
import type { DbCustomer } from "@/lib/supabase/types";
import { formatDate, formatKes, initialsOf } from "@/lib/format";

const tierOptions = ["All customers", "New", "Regular", "Loyal", "Trade"] as const;
const tierFields: readonly FormField[] = [
  { key: "name", label: "Full name", full: true, placeholder: "e.g. Kevin Mutua" },
  { key: "phone", label: "Phone", placeholder: "+254 7xx xxx xxx" },
  { key: "email", label: "Email", type: "email", placeholder: "customer@example.co.ke" },
  { key: "location", label: "Location", placeholder: "Westlands" },
  {
    key: "tier",
    label: "Tier",
    type: "select",
    options: tierOptions.slice(1).map((tier) => ({ value: tier, label: tier })),
  },
];

const emptyValues: FormValues = { name: "", phone: "", email: "", location: "", tier: "New" };

export function CustomersPage() {
  const customersQuery = useCustomers();
  const salesQuery = useSales(500);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>(tierOptions[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbCustomer | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<DbCustomer | null>(null);

  const customers = customersQuery.data ?? [];

  const spendByCustomer = useMemo(() => {
    const map = new Map<string, { spend: number; orders: number; last: string }>();
    for (const sale of salesQuery.data ?? []) {
      if (!sale.customer_id || sale.status === "Refunded") continue;
      const current = map.get(sale.customer_id) ?? { spend: 0, orders: 0, last: sale.created_at };
      map.set(sale.customer_id, {
        spend: current.spend + Number(sale.total),
        orders: current.orders + 1,
        last: sale.created_at > current.last ? sale.created_at : current.last,
      });
    }
    return map;
  }, [salesQuery.data]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesQuery =
        !needle ||
        `${customer.name} ${customer.phone ?? ""} ${customer.location ?? ""}`.toLowerCase().includes(needle);
      const matchesTier = tier === tierOptions[0] || customer.tier === tier;
      return matchesQuery && matchesTier;
    });
  }, [customers, query, tier]);

  const totalSpend = Array.from(spendByCustomer.values()).reduce((sum, entry) => sum + entry.spend, 0);
  const orders = Array.from(spendByCustomer.values()).reduce((sum, entry) => sum + entry.orders, 0);
  const repeatShare = customers.length
    ? Math.round(
        (customers.filter((customer) => (spendByCustomer.get(customer.id)?.orders ?? 0) > 1).length /
          customers.length) *
          100,
      )
    : 0;

  const change = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = (customer: DbCustomer) => {
    setEditing(customer);
    setValues({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      location: customer.location ?? "",
      tier: customer.tier,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!values["name"]?.trim()) {
      toast.error("A customer name is required");
      return;
    }

    const payload = {
      name: values["name"].trim(),
      phone: values["phone"]?.trim() || null,
      email: values["email"]?.trim() || null,
      location: values["location"]?.trim() || null,
      tier: (values["tier"] || "New") as DbCustomer["tier"],
    };

    try {
      if (editing) {
        await updateCustomer.mutateAsync({ id: editing.id, ...payload });
        toast.success("Customer updated", { description: `${payload.name} saved to Supabase.` });
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success("Customer added", { description: `${payload.name} saved to Supabase.` });
      }
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error(editing ? "Could not update the customer" : "Could not add the customer", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCustomer.mutateAsync(deleting.id);
      toast.success("Customer deleted", { description: `${deleting.name} removed from Supabase.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the customer", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Buyer records from the database, with spend calculated from their receipts."
        meta={
          customersQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              {customers.length} customers in Supabase
            </span>
          ) : null
        }
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-3.5" />
            Add customer
          </Button>
        }
      />

      <SupabaseNotice />
      {customersQuery.isError && <QueryError error={customersQuery.error} label="Could not load customers" />}

      <section aria-label="Customer summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Users} title="Customers" value={String(customers.length)} note="records in the database" color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Recorded spend" value={formatKes(totalSpend)} note="attributed to customers" color="var(--chart-2)" />
        <StatCard icon={ContactRound} title="Orders" value={String(orders)} note="receipts linked to a customer" color="var(--chart-3)" />
        <StatCard icon={Repeat} title="Repeat buyers" value={`${repeatShare}%`} note="more than one visit" color="var(--chart-4)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Customer book</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Walk-in sales are recorded without a customer.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search customers" placeholder="Search name, phone or location" className="w-full sm:w-72" />
          <FilterSelect label="Filter by tier" value={tier} onChange={setTier} options={tierOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} customers</span>
        </Toolbar>

        {customersQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading customers..." />
          </div>
        ) : !customers.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No customers yet"
              description="Add your first customer to start linking receipts to people."
              action={
                <Button type="button" size="sm" className="mt-2 h-8" onClick={openCreate}>
                  Add customer
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(customer) => customer.id}
            emptyMessage="No customers match these filters."
            caption="Customer book"
            minWidth="880px"
            columns={[
              {
                key: "name",
                header: "CUSTOMER",
                render: (customer) => (
                  <span className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
                      {initialsOf(customer.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[190px] truncate font-medium">{customer.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{customer.location ?? "—"}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "phone",
                header: "PHONE",
                render: (customer) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{customer.phone ?? "—"}</span>
                ),
              },
              { key: "tier", header: "TIER", render: (customer) => <StatusBadge status={customer.tier} /> },
              {
                key: "orders",
                header: "ORDERS",
                align: "right",
                render: (customer) => <span>{spendByCustomer.get(customer.id)?.orders ?? 0}</span>,
              },
              {
                key: "spend",
                header: "SPEND",
                align: "right",
                render: (customer) => (
                  <span className="whitespace-nowrap font-semibold">
                    {formatKes(spendByCustomer.get(customer.id)?.spend ?? 0)}
                  </span>
                ),
              },
              {
                key: "last",
                header: "LAST VISIT",
                align: "right",
                render: (customer) => {
                  const last = spendByCustomer.get(customer.id)?.last;
                  return (
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {last ? formatDate(last) : "—"}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                header: "ACTIONS",
                align: "right",
                render: (customer) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => openEdit(customer)}>
                      <Pencil aria-hidden="true" className="size-3" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-destructive"
                      onClick={() => setDeleting(customer)}
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
        title={editing ? "Update customer" : "Add customer"}
        description="Saved to the pos_customers table in Supabase."
        fields={tierFields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createCustomer.isPending || updateCustomer.isPending}
        submitLabel={editing ? "Save changes" : "Save customer"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete customer?"
        description={`Remove ${deleting?.name ?? "this customer"} from the customer book? Past receipts stay in place.`}
        pending={deleteCustomer.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
