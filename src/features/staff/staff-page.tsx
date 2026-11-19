import { BadgeCheck, Clock3, Plus, ShieldCheck, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
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
import { sampleBranches, sampleStaff, type StaffMember } from "@/data/sample/people";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCashiers } from "@/lib/auth/roles";
import { formatKes, initialsOf } from "@/lib/format";

const roleOptions = ["All roles", "Owner", "Manager", "Cashier", "Storekeeper", "Technician"] as const;

const emptyCashier = {
  name: "",
  email: "",
  password: "",
  branchId: sampleBranches[0]?.id ?? "br-01",
  shift: "09:00 – 18:00",
};

export function StaffPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(roleOptions[0]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCashier);
  const { user, accounts, addCashier } = useAuth();

  const team = useMemo<StaffMember[]>(() => {
    const added = accounts
      .filter((account) => account.source === "manager")
      .filter((account) => !sampleStaff.some((member) => member.email.toLowerCase() === account.email))
      .map<StaffMember>((account) => ({
        id: account.id,
        name: account.name,
        role: "Cashier",
        branchId: account.branchId ?? sampleBranches[0]?.id ?? "br-01",
        status: "Active",
        shift: account.shift ?? "09:00 – 18:00",
        salesThisMonth: 0,
        email: account.email,
      }));

    return [...added, ...sampleStaff];
  }, [accounts]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return team.filter((member) => {
      const matchesQuery = !needle || `${member.name} ${member.email}`.toLowerCase().includes(needle);
      const matchesRole = role === roleOptions[0] || member.role === role;
      return matchesQuery && matchesRole;
    });
  }, [team, query, role]);

  const salesThisMonth = team.reduce((sum, member) => sum + member.salesThisMonth, 0);
  const active = team.filter((member) => member.status === "Active").length;
  const onLeave = team.filter((member) => member.status === "On leave").length;

  const submit = () => {
    const result = addCashier(form);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Cashier added", {
      description: `${result.account.name} can now sign in and only see the point of sale.`,
    });
    setForm(emptyCashier);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Staff & users"
        description="Team members, their roles, branches and shifts."
        meta={<PreviewBadge />}
        actions={
          user && canManageCashiers(user.role) ? (
            <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => setOpen(true)}>
              <Plus aria-hidden="true" className="size-3.5" />
              Add cashier
            </Button>
          ) : null
        }
      />

      <section aria-label="Staff summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Users} title="Team size" value={String(team.length)} note="accounts in preview" color="var(--chart-1)" />
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
          <SearchField value={query} onChange={setQuery} label="Search team" placeholder="Search name or email" className="w-full sm:w-64" />
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
          minWidth="780px"
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
                    <span className="block text-[10px] text-muted-foreground">{member.email}</span>
                  </span>
                </span>
              ),
            },
            { key: "role", header: "ROLE", render: (member) => <span className="whitespace-nowrap rounded-[5px] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{member.role}</span> },
            {
              key: "branch",
              header: "BRANCH",
              render: (member) => (
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {sampleBranches.find((branch) => branch.id === member.branchId)?.name ?? "—"}
                </span>
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
          ]}
        />
        <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
          Cashiers added here sign in with the email and password you set. Credentials are stored in this browser for the preview.
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Add cashier</DialogTitle>
            <DialogDescription className="text-[11px]">
              Cashiers can only open the point of sale and their limited dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cashier-name" className="text-[11px]">
                Full name
              </Label>
              <Input
                id="cashier-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-9 text-[11px]"
                placeholder="e.g. Mary Wanjiku"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cashier-email" className="text-[11px]">
                Email
              </Label>
              <Input
                id="cashier-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="h-9 text-[11px]"
                placeholder="cashier@samulbikers.co.ke"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cashier-password" className="text-[11px]">
                Temporary password
              </Label>
              <Input
                id="cashier-password"
                type="text"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="h-9 text-[11px]"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cashier-branch" className="text-[11px]">
                Branch
              </Label>
              <select
                id="cashier-branch"
                value={form.branchId}
                onChange={(event) => setForm({ ...form, branchId: event.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-[11px] text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {sampleBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cashier-shift" className="text-[11px]">
                Shift
              </Label>
              <Input
                id="cashier-shift"
                value={form.shift}
                onChange={(event) => setForm({ ...form, shift: event.target.value })}
                className="h-9 text-[11px]"
                placeholder="09:00 – 18:00"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button type="button" onClick={submit} className="h-9">
              Add cashier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
