import { ContactRound, Plus, Repeat, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers, useSales } from "@/lib/supabase/queries";
import { useCreateCustomer } from "@/lib/supabase/mutations";
import { formatDate, formatKes, initialsOf } from "@/lib/format";

const tierOptions = ["All customers", "New", "Regular", "Loyal", "Trade"] as const;

export function CustomersPage() {
  const customersQuery = useCustomers();
  const salesQuery = useSales(500);
  const createCustomer = useCreateCustomer();

  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>(tierOptions[0]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "" });

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

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("A customer name is required");
      return;
    }

    try {
      await createCustomer.mutateAsync({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      toast.success("Customer added", { description: `${form.name.trim()} saved to Supabase.` });
      setForm({ name: "", phone: "", email: "", location: "" });
      setOpen(false);
    } catch (error) {
      toast.error("Could not add the customer", {
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
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => setOpen(true)}>
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
                <Button type="button" size="sm" className="mt-2 h-8" onClick={() => setOpen(true)}>
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
            minWidth="760px"
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
            ]}
          />
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Add customer</DialogTitle>
            <DialogDescription className="text-[11px]">Saved to the pos_customers table.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customer-name" className="text-[11px]">
                Full name
              </Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-9 text-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone" className="text-[11px]">
                Phone
              </Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="h-9 text-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-location" className="text-[11px]">
                Location
              </Label>
              <Input
                id="customer-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className="h-9 text-[11px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customer-email" className="text-[11px]">
                Email
              </Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="h-9 text-[11px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={createCustomer.isPending} className="h-9">
              {createCustomer.isPending ? "Saving..." : "Save customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
