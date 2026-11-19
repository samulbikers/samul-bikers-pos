import { CircleDollarSign, Clock, Package, Star, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { useSuppliers } from "@/lib/supabase/queries";
import { formatKes } from "@/lib/format";

export function SuppliersPage() {
  const suppliersQuery = useSuppliers();
  const [query, setQuery] = useState("");

  const suppliers = suppliersQuery.data ?? [];

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return suppliers.filter((supplier) =>
      !needle ||
      `${supplier.name} ${supplier.contact_name ?? ""} ${supplier.terms}`.toLowerCase().includes(needle),
    );
  }, [suppliers, query]);

  const outstanding = suppliers.reduce((sum, supplier) => sum + Number(supplier.outstanding), 0);
  const averageLeadTime = suppliers.length
    ? suppliers.reduce((sum, supplier) => sum + supplier.lead_time_days, 0) / suppliers.length
    : 0;

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Vendors stored in Supabase, their terms and outstanding balances."
        meta={
          suppliersQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live from Supabase
            </span>
          ) : null
        }
      />

      <SupabaseNotice />
      {suppliersQuery.isError && <QueryError error={suppliersQuery.error} label="Could not load suppliers" />}

      <section aria-label="Supplier summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Truck} title="Active suppliers" value={String(suppliers.length)} note="records in the database" color="var(--chart-1)" />
        <StatCard icon={CircleDollarSign} title="Outstanding" value={formatKes(outstanding)} note="payable on terms" color="var(--chart-2)" />
        <StatCard
          icon={Clock}
          title="Average lead time"
          value={suppliers.length ? `${averageLeadTime.toFixed(1)} days` : "—"}
          note="order to delivery"
          color="var(--chart-4)"
        />
        <StatCard icon={Package} title="Products sourced" value={String(suppliers.length)} note="supplier records" color="var(--chart-3)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Supplier directory</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Contacts and payment terms come from the database.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search suppliers" placeholder="Search supplier, contact or terms" className="w-full sm:w-72" />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} suppliers</span>
        </Toolbar>

        {suppliersQuery.isLoading ? (
          <div className="px-4 pb-4 sm:px-5">
            <QueryLoading label="Loading suppliers..." />
          </div>
        ) : !suppliers.length ? (
          <div className="px-4 pb-4 sm:px-5">
            <EmptyState
              title="No suppliers recorded"
              description="Suppliers added to the pos_suppliers table will be listed here."
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(supplier) => supplier.id}
            emptyMessage="No suppliers match this search."
            caption="Supplier directory"
            minWidth="820px"
            columns={[
              {
                key: "name",
                header: "SUPPLIER",
                render: (supplier) => (
                  <span className="min-w-0">
                    <span className="block max-w-[220px] truncate font-medium">{supplier.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {supplier.contact_name ? `Contact: ${supplier.contact_name}` : "No contact name"}
                    </span>
                  </span>
                ),
              },
              {
                key: "phone",
                header: "PHONE",
                render: (supplier) => (
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{supplier.phone ?? "—"}</span>
                ),
              },
              {
                key: "terms",
                header: "TERMS",
                render: (supplier) => (
                  <span className="whitespace-nowrap rounded-[5px] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    {supplier.terms}
                  </span>
                ),
              },
              {
                key: "lead",
                header: "LEAD TIME",
                align: "right",
                render: (supplier) => <span className="whitespace-nowrap">{supplier.lead_time_days} days</span>,
              },
              {
                key: "outstanding",
                header: "OUTSTANDING",
                align: "right",
                render: (supplier) => (
                  <span className={`whitespace-nowrap font-semibold ${Number(supplier.outstanding) ? "text-card-foreground" : "text-emerald"}`}>
                    {Number(supplier.outstanding) ? formatKes(Number(supplier.outstanding)) : "Settled"}
                  </span>
                ),
              },
              {
                key: "rating",
                header: "RATING",
                align: "right",
                render: (supplier) => (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground">
                    <Star aria-hidden="true" className="size-3 text-amber" />
                    {supplier.rating === null ? "—" : Number(supplier.rating).toFixed(1)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
