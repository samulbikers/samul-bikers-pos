import { CircleDollarSign, Clock, Package, Star, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sampleSuppliers } from "@/data/sample/people";
import { formatKes } from "@/lib/format";

export function SuppliersPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleSuppliers.filter((supplier) =>
      !needle || `${supplier.name} ${supplier.contact} ${supplier.terms}`.toLowerCase().includes(needle),
    );
  }, [query]);

  const outstanding = sampleSuppliers.reduce((sum, supplier) => sum + supplier.outstanding, 0);
  const averageLeadTime =
    sampleSuppliers.reduce((sum, supplier) => sum + supplier.leadTimeDays, 0) / sampleSuppliers.length;

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Vendors the shop buys from, their terms and what is still owed."
        meta={<PreviewBadge />}
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" disabled title="Supplier records arrive with the live backend">
            <Truck aria-hidden="true" className="size-3.5" />
            Add supplier
          </Button>
        }
      />

      <section aria-label="Supplier summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Truck} title="Active suppliers" value={String(sampleSuppliers.length)} note="sample vendors" color="var(--chart-1)" />
        <StatCard icon={CircleDollarSign} title="Outstanding" value={formatKes(outstanding)} note="payable on terms" color="var(--chart-2)" />
        <StatCard icon={Clock} title="Average lead time" value={`${averageLeadTime.toFixed(1)} days`} note="order to delivery" color="var(--chart-4)" />
        <StatCard icon={Package} title="Products sourced" value={String(sampleSuppliers.reduce((sum, supplier) => sum + supplier.products, 0))} note="catalogue coverage" color="var(--chart-3)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Supplier directory</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Contact details are sample data for the preview.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search suppliers" placeholder="Search supplier, contact or terms" className="w-full sm:w-72" />
          <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} suppliers</span>
        </Toolbar>
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
                  <span className="block text-[10px] text-muted-foreground">Contact: {supplier.contact}</span>
                </span>
              ),
            },
            { key: "phone", header: "PHONE", render: (supplier) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{supplier.phone}</span> },
            {
              key: "terms",
              header: "TERMS",
              render: (supplier) => (
                <span className="whitespace-nowrap rounded-[5px] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                  {supplier.terms}
                </span>
              ),
            },
            { key: "lead", header: "LEAD TIME", align: "right", render: (supplier) => <span className="whitespace-nowrap">{supplier.leadTimeDays} days</span> },
            { key: "products", header: "PRODUCTS", align: "right", render: (supplier) => <span className="whitespace-nowrap">{supplier.products}</span> },
            {
              key: "outstanding",
              header: "OUTSTANDING",
              align: "right",
              render: (supplier) => (
                <span className={`whitespace-nowrap font-semibold ${supplier.outstanding ? "text-card-foreground" : "text-emerald"}`}>
                  {supplier.outstanding ? formatKes(supplier.outstanding) : "Settled"}
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
                  {supplier.rating.toFixed(1)}
                </span>
              ),
            },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Preview directory · Not connected to procurement
        </div>
      </section>
    </>
  );
}
