import { CircleDollarSign, Clock, Package, Pencil, Plus, Star, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, FormDialog, type FormField, type FormValues } from "@/components/data/form-dialog";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { StatCard } from "@/components/data/stat-card";
import { SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/lib/supabase/queries";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useUpdateSupplier,
} from "@/lib/supabase/mutations";
import type { DbSupplier } from "@/lib/supabase/types";
import { formatKes } from "@/lib/format";

const fields: readonly FormField[] = [
  { key: "name", label: "Supplier name", full: true, placeholder: "e.g. Helmet House Kenya" },
  { key: "contact_name", label: "Contact person", placeholder: "Full name" },
  { key: "phone", label: "Phone", placeholder: "+254 7xx xxx xxx" },
  { key: "email", label: "Email", type: "email", placeholder: "orders@supplier.co.ke" },
  {
    key: "terms",
    label: "Payment terms",
    type: "select",
    options: ["Net 15", "Net 30", "Net 45", "Cash on delivery", "Prepaid"].map((term) => ({
      value: term,
      label: term,
    })),
  },
  { key: "lead_time_days", label: "Lead time (days)", type: "number" },
  { key: "rating", label: "Rating (0–5)", type: "number", step: "0.1" },
  { key: "outstanding", label: "Outstanding (KES)", type: "number", step: "0.01" },
];

const emptyValues: FormValues = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  terms: "Net 30",
  lead_time_days: "0",
  rating: "",
  outstanding: "0",
};

export function SuppliersPage() {
  const suppliersQuery = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbSupplier | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<DbSupplier | null>(null);

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

  const change = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = (supplier: DbSupplier) => {
    setEditing(supplier);
    setValues({
      name: supplier.name,
      contact_name: supplier.contact_name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      terms: supplier.terms,
      lead_time_days: String(supplier.lead_time_days),
      rating: supplier.rating === null ? "" : String(supplier.rating),
      outstanding: String(supplier.outstanding),
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!values["name"]?.trim()) {
      toast.error("A supplier name is required");
      return;
    }

    const payload = {
      name: values["name"].trim(),
      contact_name: values["contact_name"]?.trim() || null,
      phone: values["phone"]?.trim() || null,
      email: values["email"]?.trim() || null,
      terms: values["terms"] || "Net 30",
      lead_time_days: Number(values["lead_time_days"] || 0),
      rating: values["rating"] ? Number(values["rating"]) : null,
      outstanding: Number(values["outstanding"] || 0),
    };

    try {
      if (editing) {
        await updateSupplier.mutateAsync({ id: editing.id, ...payload });
        toast.success("Supplier updated", { description: `${payload.name} saved to Supabase.` });
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success("Supplier added", { description: `${payload.name} saved to Supabase.` });
      }
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error("Could not save the supplier", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteSupplier.mutateAsync(deleting.id);
      toast.success("Supplier deleted", { description: `${deleting.name} removed from Supabase.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the supplier", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

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
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-3.5" />
            Add supplier
          </Button>
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
              description="Add a supplier to start tracking contacts, terms and balances."
              action={
                <Button type="button" size="sm" className="mt-2 h-8" onClick={openCreate}>
                  Add supplier
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            getRowId={(supplier) => supplier.id}
            emptyMessage="No suppliers match this search."
            caption="Supplier directory"
            minWidth="980px"
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
              {
                key: "actions",
                header: "ACTIONS",
                align: "right",
                render: (supplier) => (
                  <span className="flex items-center justify-end gap-1">
                    <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => openEdit(supplier)}>
                      <Pencil aria-hidden="true" className="size-3" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px] text-destructive"
                      onClick={() => setDeleting(supplier)}
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
        title={editing ? "Update supplier" : "Add supplier"}
        description="Saved to the pos_suppliers table in Supabase."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createSupplier.isPending || updateSupplier.isPending}
        submitLabel={editing ? "Save changes" : "Save supplier"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete supplier?"
        description={`Remove ${deleting?.name ?? "this supplier"} from the directory? This cannot be undone.`}
        pending={deleteSupplier.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
