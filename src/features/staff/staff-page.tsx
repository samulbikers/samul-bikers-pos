import { BadgeCheck, Clock3, ShieldCheck, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { sampleBranches, sampleStaff } from "@/data/sample/people";
import { formatKes, initialsOf } from "@/lib/format";

const roleOptions = ["All roles", "Owner", "Manager", "Cashier", "Storekeeper", "Technician"] as const;

export function StaffPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(roleOptions[0]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleStaff.filter((member) => {
      const matchesQuery = !needle || `${member.name} ${member.email}`.toLowerCase().includes(needle);
      const matchesRole = role === roleOptions[0] || member.role === role;
      return matchesQuery && matchesRole;
    });
  }, [query, role]);

  const salesThisMonth = sampleStaff.reduce((sum, member) => sum + member.salesThisMonth, 0);
  const active = sampleStaff.filter((member) => member.status === "Active").length;
  const onLeave = sampleStaff.filter((member) => member.status === "On leave").length;

  return (
    <>
      <PageHeader
        title="Staff & users"
        description="Team members, their roles, branches and shifts."
        meta={<PreviewBadge />}
      />

      <section aria-label="Staff summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Users} title="Team size" value={String(sampleStaff.length)} note="accounts in preview" color="var(--chart-1)" />
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
          Preview team · Account changes require the live backend
        </div>
      </section>
    </>
  );
}
