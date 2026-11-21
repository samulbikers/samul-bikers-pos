import { Link } from "@tanstack/react-router";
import { BadgeCheck, Clock3, Download, KeyRound, Pencil, Plus, ShieldCheck, Trash2, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, FormDialog, type FormField, type FormValues } from "@/components/data/form-dialog";
import { DataTable } from "@/components/data/data-table";
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
import { sampleStaff, type StaffMember } from "@/data/sample/people";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCashiers } from "@/lib/auth/roles";
import { useBranches } from "@/lib/branches/branch-store";
import { formatKes, initialsOf } from "@/lib/format";

const roleOptions = ["All roles", "Owner", "Manager", "Cashier", "Storekeeper", "Technician"] as const;

type TeamRow = StaffMember & {
  accountId?: string | undefined;
  username?: string | undefined;
};

const emptyValues: FormValues = {
  name: "",
  username: "",
  pin: "",
  role: "cashier",
  branchId: "",
  shift: "09:00 – 18:00",
};

export function StaffPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(roleOptions[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingPending, setDeletingPending] = useState(false);
  const { user, accounts, addStaff, updateStaff, deleteStaff, resetPin: resetAccountPin } = useAuth();
  const branches = useBranches();

  const team = useMemo<TeamRow[]>(() => {
    const accountsByName = new Map(accounts.map((account) => [account.name.toLowerCase(), account]));
    const sampleRows = sampleStaff.map<TeamRow>((member) => {
      const account = accountsByName.get(member.name.toLowerCase());
      return {
        ...member,
        accountId: account?.id,
        username: account?.username,
      };
    });

    const knownNames = new Set(sampleStaff.map((member) => member.name.toLowerCase()));
    const added = accounts
      .filter((account) => account.source === "manager" && !knownNames.has(account.name.toLowerCase()))
      .map<TeamRow>((account) => ({
        id: account.id,
        name: account.name,
        role: account.role === "manager" ? "Manager" : "Cashier",
        branchId: account.branchId ?? branches[0]?.id ?? "br-01",
        status: "Active",
        shift: account.shift ?? "09:00 – 18:00",
        salesThisMonth: 0,
        email: account.username,
        accountId: account.id,
        username: account.username,
      }));

    return [...added, ...sampleRows];
  }, [accounts, branches]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return team.filter((member) => {
      const matchesQuery = !needle || `${member.name} ${member.username ?? ""}`.toLowerCase().includes(needle);
      const matchesRole = role === roleOptions[0] || member.role === role;
      return matchesQuery && matchesRole;
    });
  }, [team, query, role]);

  const salesThisMonth = team.reduce((sum, member) => sum + member.salesThisMonth, 0);
  const active = team.filter((member) => member.status === "Active").length;
  const onLeave = team.filter((member) => member.status === "On leave").length;
  const branchName = (id: string) => branches.find((branch) => branch.id === id)?.name ?? "—";

  const fields = useMemo<readonly FormField[]>(
    () => [
      { key: "name", label: "Full name", full: true, placeholder: "e.g. Mary Wanjiku" },
      {
        key: "role",
        label: "Role",
        type: "select",
        options: [
          { value: "cashier", label: "Cashier" },
          { value: "manager", label: "Branch manager" },
        ],
      },
      {
        key: "branchId",
        label: "Branch",
        type: "select",
        options: branches.map((branch) => ({ value: branch.id, label: branch.name })),
      },
      { key: "username", label: "Username", placeholder: "e.g. mary" },
      ...(editingId
        ? []
        : [{ key: "pin", label: "4-digit PIN", placeholder: "••••" } satisfies FormField]),
      { key: "shift", label: "Shift", full: true, placeholder: "09:00 – 18:00" },
    ],
    [branches, editingId],
  );

  const change = (key: string, value: string) =>
    setValues((current) => ({
      ...current,
      [key]: key === "username" ? value.toLowerCase().replace(/\s/g, "") : key === "pin" ? value.replace(/\D/g, "").slice(0, 4) : value,
    }));

  const openCreate = () => {
    setEditingId(null);
    setValues({ ...emptyValues, branchId: branches[0]?.id ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (member: TeamRow) => {
    if (!member.accountId) return;
    const account = accounts.find((entry) => entry.id === member.accountId);
    if (!account || account.role === "owner") return;

    setEditingId(account.id);
    setValues({
      name: account.name,
      username: account.username,
      pin: "",
      role: account.role === "manager" ? "manager" : "cashier",
      branchId: account.branchId ?? branches[0]?.id ?? "",
      shift: account.shift ?? "09:00 – 18:00",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const result = await updateStaff(editingId, {
          name: values["name"] ?? "",
          username: values["username"] ?? "",
          role: (values["role"] === "manager" ? "manager" : "cashier") as "manager" | "cashier",
          branchId: values["branchId"] ?? "",
          shift: values["shift"] ?? "",
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Account updated", { description: `${result.account.name} saved to Supabase.` });
      } else {
        const result = await addStaff({
          name: values["name"] ?? "",
          username: values["username"] ?? "",
          pin: values["pin"] ?? "",
          role: values["role"] === "manager" ? "manager" : "cashier",
          branchId: values["branchId"] ?? "",
          shift: values["shift"] ?? "",
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(result.account.role === "manager" ? "Branch manager added" : "Cashier added", {
          description: `${result.account.name} can sign in with username ${result.account.username} and their 4-digit PIN.`,
        });
      }

      setDialogOpen(false);
      setEditingId(null);
      setValues(emptyValues);
    } finally {
      setSaving(false);
    }
  };

  const submitPinReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await resetAccountPin(resetTarget.id, resetPin);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("PIN reset", { description: `${result.account.name} can sign in with the new PIN.` });
      setResetTarget(null);
      setResetPin("");
    } finally {
      setResetting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (deleting.id === user?.id) {
      toast.error("You cannot delete the account you are signed in with.");
      return;
    }
    setDeletingPending(true);
    try {
      const result = await deleteStaff(deleting.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Account deleted", { description: `${deleting.name} can no longer sign in.` });
      setDeleting(null);
    } finally {
      setDeletingPending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Staff & users"
        description="Team members, their roles, branches, shifts and sign-in PINs."
        meta={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
            Live from Supabase
          </span>
        }
        actions={
          user && canManageCashiers(user.role) ? (
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
              <Plus aria-hidden="true" className="size-3.5" />
              Add account
            </Button>
          ) : null
        }
      />

      <section aria-label="Staff summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Users} title="Team size" value={String(team.length)} note="accounts in Supabase" color="var(--chart-1)" />
        <StatCard icon={BadgeCheck} title="Active today" value={String(active)} note="clocked in or scheduled" color="var(--chart-2)" />
        <StatCard icon={Wallet} title="Staff sales" value={formatKes(salesThisMonth)} note="attributed this month" color="var(--chart-3)" />
        <StatCard icon={Clock3} title="On leave" value={String(onLeave)} note="returning this week" color="var(--chart-4)" />
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
        <div className="px-4 pb-2 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-card-foreground">Team directory</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Roles control what each person can reach in the live app.</p>
        </div>
        <Toolbar>
          <SearchField value={query} onChange={setQuery} label="Search team" placeholder="Search name or username" className="w-full sm:w-64" />
          <FilterSelect label="Filter by role" value={role} onChange={setRole} options={roleOptions} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3" />
            {rows.length} accounts
          </span>
        </Toolbar>
        <DataTable
          rows={rows}
          getRowId={(member) => member.id}
          emptyMessage="No team members match these filters."
          caption="Staff directory"
          minWidth="1080px"
          columns={[
            {
              key: "name",
              header: "MEMBER",
              render: (member) => (
                <span className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
                    {initialsOf(member.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[170px] truncate font-medium">{member.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {member.username ? `@${member.username}` : member.email}
                    </span>
                  </span>
                </span>
              ),
            },
            { key: "role", header: "ROLE", render: (member) => <span className="whitespace-nowrap rounded-[5px] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{member.role}</span> },
            {
              key: "branch",
              header: "BRANCH",
              render: (member) => (
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">{branchName(member.branchId)}</span>
              ),
            },
            { key: "shift", header: "SHIFT", render: (member) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{member.shift}</span> },
            {
              key: "sales",
              header: "SALES",
              align: "right",
              render: (member) =>
                member.salesThisMonth ? (
                  <span className="whitespace-nowrap font-semibold">{formatKes(member.salesThisMonth)}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                ),
            },
            { key: "status", header: "STATUS", align: "right", render: (member) => <StatusBadge status={member.status} /> },
            {
              key: "actions",
              header: "ACTIONS",
              align: "right",
              render: (member) =>
                user && canManageCashiers(user.role) ? (
                  <span className="flex items-center justify-end gap-1">
                    {member.role === "Cashier" ? (
                      <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[10px] font-medium text-primary">
                        <Link to="/z-report" search={{ cashier: member.name }}>
                          <Download aria-hidden="true" className="size-3" />
                          Z report
                        </Link>
                      </Button>
                    ) : null}
                    {member.accountId && member.role !== "Owner" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[10px]"
                          onClick={() => openEdit(member)}
                        >
                          <Pencil aria-hidden="true" className="size-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[10px]"
                          onClick={() => {
                            setResetTarget({ id: member.accountId!, name: member.name });
                            setResetPin("");
                          }}
                        >
                          <KeyRound aria-hidden="true" className="size-3" />
                          Reset PIN
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[10px] text-destructive"
                          onClick={() => setDeleting({ id: member.accountId!, name: member.name })}
                        >
                          <Trash2 aria-hidden="true" className="size-3" />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                ),
            },
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Cashiers and managers sign in with their username and 4-digit PIN. Accounts and hashed PINs are stored in Supabase.
        </div>
      </section>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Update account" : "Add account"}
        description="Create or edit a cashier or branch manager login for a specific branch."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={saving}
        submitLabel={editingId ? "Save changes" : "Create account"}
      />

      <Dialog open={Boolean(resetTarget)} onOpenChange={(next) => (next ? null : setResetTarget(null))}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Reset PIN</DialogTitle>
            <DialogDescription className="text-[11px]">
              Set a new 4-digit PIN for {resetTarget?.name ?? "this account"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reset-pin" className="text-[11px]">
              New PIN
            </Label>
            <Input
              id="reset-pin"
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={resetPin}
              onChange={(event) => setResetPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-9 text-[11px] tracking-[0.3em]"
              placeholder="••••"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setResetTarget(null)} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={submitPinReset} disabled={resetting} className="h-9">
              {resetting ? "Resetting..." : "Reset PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete account?"
        description={`Remove ${deleting?.name ?? "this account"}? They will no longer be able to sign in.`}
        pending={deletingPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
