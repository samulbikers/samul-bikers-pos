import { ContactRound, Repeat, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sampleCustomers, type Customer } from "@/data/sample/people";
import { formatKes, initialsOf } from "@/lib/format";
import { Button } from "@/components/ui/button";

const tierOptions = ["All customers", "New", "Regular", "Loyal", "Trade"] as const;

export function CustomersPage() {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<string>(tierOptions[0]);
  const [selected, setSelected] = useState<Customer | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleCustomers.filter((customer) => {
      const matchesQuery =
        !needle || `${customer.name} ${customer.phone} ${customer.location}`.toLowerCase().includes(needle);
      const matchesTier = tier === tierOptions[0] || customer.tier === tier;
      return matchesQuery && matchesTier;
    });
  }, [query, tier]);

  const totalSpend = sampleCustomers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const orders = sampleCustomers.reduce((sum, customer) => sum + customer.orders, 0);
  const repeatShare = Math.round(
    (sampleCustomers.filter((customer) => customer.orders > 1).length / sampleCustomers.length) * 100,
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description="Buyers on record, what they spend and how recently they visited."
        meta={<PreviewBadge />}
      />

      <section aria-label="Customer summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Users} title="Customers" value={String(sampleCustomers.length)} note="in this sample book" color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Lifetime spend" value={formatKes(totalSpend)} note="all sample buyers" color="var(--chart-2)" />
        <StatCard icon={ContactRound} title="Orders" value={String(orders)} note="sample purchase history" color="var(--chart-3)" />
        <StatCard icon={Repeat} title="Repeat buyers" value={`${repeatShare}%`} note="more than one visit" color="var(--chart-4)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Customer book</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Select a customer to see contact details.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search customers" placeholder="Search name, phone or location" className="w-full sm:w-72" />
          <FilterSelect label="Filter by tier" value={tier} onChange={setTier} options={tierOptions} />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} customers</span>
        </Toolbar>
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
                    <button type="button" onClick={() => setSelected(customer)} className="block max-w-[180px] truncate text-left font-medium text-primary hover:underline">
                      {customer.name}
                    </button>
                    <span className="block text-[10px] text-muted-foreground">{customer.location}</span>
                  </span>
                </span>
              ),
            },
            { key: "phone", header: "PHONE", render: (customer) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{customer.phone}</span> },
            { key: "tier", header: "TIER", render: (customer) => <StatusBadge status={customer.tier} /> },
            { key: "orders", header: "ORDERS", align: "right", render: (customer) => <span>{customer.orders}</span> },
            { key: "spend", header: "SPEND", align: "right", render: (customer) => <span className="whitespace-nowrap font-semibold">{formatKes(customer.totalSpend)}</span> },
            { key: "last", header: "LAST VISIT", align: "right", render: (customer) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{customer.lastVisit}</span> },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Preview customer book · Contacts are sample records
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{selected?.name}</DialogTitle>
            <DialogDescription className="text-[11px]">{selected?.location} · {selected?.phone}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Lifetime spend</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{formatKes(selected.totalSpend)}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Orders</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{selected.orders}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Last visit</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{selected.lastVisit}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Tier</dt>
                  <dd className="mt-0.5"><StatusBadge status={selected.tier} /></dd>
                </div>
              </dl>
              <p className="rounded-md bg-muted/50 p-2 text-[10px] text-muted-foreground">
                Email: {selected.email}
              </p>
              <Button type="button" variant="outline" className="h-9 w-full" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
