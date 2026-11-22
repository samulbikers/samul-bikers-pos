import { Link } from "@tanstack/react-router";
import { Building2, MapPin, Pencil, Phone, Plus, Store, Trash2, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ConfirmDialog,
  FormDialog,
  type FormField,
  type FormValues,
} from "@/components/data/form-dialog";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCashiers } from "@/lib/auth/roles";
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useUpdateBranch,
  type Branch,
} from "@/lib/branches/branch-store";
import { formatKes } from "@/lib/format";

const fields: readonly FormField[] = [
  { key: "name", label: "Branch name", full: true, placeholder: "e.g. Thika outlet" },
  { key: "city", label: "Town / city", placeholder: "Nairobi" },
  { key: "phone", label: "Phone", placeholder: "+254 7xx xxx xxx" },
  { key: "address", label: "Address", full: true, placeholder: "Street, building or stall" },
  {
    key: "manager",
    label: "Manager (optional)",
    full: true,
    placeholder: "Name shown on the branch card",
  },
];

const emptyValues: FormValues = { name: "", city: "", address: "", phone: "", manager: "" };

export function BranchesPage() {
  const branches = useBranches();
  const { user, accounts } = useAuth();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const totalRevenue = branches.reduce((sum, branch) => sum + branch.monthlyRevenue, 0);
  const totalStock = branches.reduce((sum, branch) => sum + branch.stockValue, 0);
  const isAdmin = user ? canManageCashiers(user.role) : false;
  const accountsFor = (branchId: string) =>
    accounts.filter((account) => account.branchId === branchId).length;

  const change = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setValues({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      manager: branch.manager,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    const input = {
      name: values["name"] ?? "",
      city: values["city"] ?? "",
      address: values["address"] ?? "",
      phone: values["phone"] ?? "",
      manager: values["manager"] ?? "",
    };

    try {
      const branch = editing
        ? await updateBranch.mutateAsync({ id: editing.id, ...input })
        : await createBranch.mutateAsync(input);
      toast.success(editing ? "Branch updated" : "Branch added", {
        description: `${branch.name} saved to Supabase.${editing ? "" : " Create its cashier or manager login in Staff & users."}`,
      });
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error(editing ? "Could not update the branch" : "Could not add the branch", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (accountsFor(deleting.id) > 0) {
      toast.error("Move or delete the branch accounts before deleting this branch.");
      return;
    }

    try {
      await deleteBranch.mutateAsync(deleting.id);
      toast.success("Branch deleted", { description: `${deleting.name} removed from Supabase.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the branch", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Branches"
        description="Locations the business trades from, with monthly revenue and sign-in accounts."
        meta={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
            Live from Supabase
          </span>
        }
        actions={
          isAdmin ? (
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
              <Plus aria-hidden="true" className="size-3.5" />
              Add branch
            </Button>
          ) : null
        }
      />

      <section
        aria-label="Branch summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]"
      >
        <StatCard
          icon={Store}
          title="Branches"
          value={String(branches.length)}
          note="in Supabase"
          color="var(--chart-1)"
        />
        <StatCard
          icon={Wallet}
          title="Monthly revenue"
          value={formatKes(totalRevenue)}
          note="all locations"
          color="var(--chart-2)"
        />
        <StatCard
          icon={Building2}
          title="Stock value"
          value={formatKes(totalStock)}
          note="retail valuation"
          color="var(--chart-3)"
        />
        <StatCard
          icon={Users}
          title="Team"
          value={String(branches.reduce((sum, branch) => sum + branch.staff, 0))}
          note="across locations"
          color="var(--chart-4)"
        />
      </section>

      <section aria-label="Branch cards" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {branches.map((branch) => {
          const share = totalRevenue ? Math.round((branch.monthlyRevenue / totalRevenue) * 100) : 0;

          return (
            <article
              key={branch.id}
              className="rise-in flex min-w-0 flex-col rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-[16px] font-semibold text-card-foreground">
                    {branch.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3" />
                    {branch.address ? `${branch.address}, ${branch.city}` : branch.city}
                  </p>
                </div>
                <StatusBadge status={branch.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Monthly revenue</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">
                    {formatKes(branch.monthlyRevenue)}
                  </dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Stock value</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">
                    {formatKes(branch.stockValue)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-amber"
                    style={{ width: `${Math.max(share, 5)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {share}% of recorded branch revenue
                </p>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Users aria-hidden="true" className="size-3.5" />
                  {branch.manager} · {branch.staff} staff · {accountsFor(branch.id)} login(s)
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone aria-hidden="true" className="size-3.5" />
                  {branch.phone}
                </p>
              </div>

              {isAdmin ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-[10px]">
                    <Link to="/staff">
                      <Plus aria-hidden="true" className="size-3" />
                      Add branch account
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 px-2 text-[10px]"
                    onClick={() => openEdit(branch)}
                  >
                    <Pencil aria-hidden="true" className="size-3" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-[10px] text-destructive"
                    onClick={() => setDeleting(branch)}
                  >
                    <Trash2 aria-hidden="true" className="size-3" />
                    Delete
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Update branch" : "Add branch"}
        description="New branches become selectable when you create cashier or manager accounts."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createBranch.isPending || updateBranch.isPending}
        submitLabel={editing ? "Save changes" : "Add branch"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete branch?"
        description={`Remove ${deleting?.name ?? "this branch"}? Branches with login accounts must be cleared first.`}
        pending={deleteBranch.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
