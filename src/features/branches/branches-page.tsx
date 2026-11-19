import { Building2, MapPin, Phone, Plus, Store, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PreviewBadge } from "@/components/data/preview-badge";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { sampleBranches } from "@/data/sample/people";
import { formatKes } from "@/lib/format";

export function BranchesPage() {
  const totalRevenue = sampleBranches.reduce((sum, branch) => sum + branch.monthlyRevenue, 0);
  const totalStock = sampleBranches.reduce((sum, branch) => sum + branch.stockValue, 0);

  return (
    <>
      <PageHeader
        title="Branches"
        description="Locations the business trades from, with monthly revenue and stock cover."
        meta={<PreviewBadge />}
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.info("Branch setup is disabled in the preview workspace.")}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Add branch
          </Button>
        }
      />

      <section aria-label="Branch summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Store} title="Branches" value={String(sampleBranches.length)} note="in this preview" color="var(--chart-1)" />
        <StatCard icon={Wallet} title="Monthly revenue" value={formatKes(totalRevenue)} note="all locations" color="var(--chart-2)" />
        <StatCard icon={Building2} title="Stock value" value={formatKes(totalStock)} note="retail valuation" color="var(--chart-3)" />
        <StatCard icon={Users} title="Team" value={String(sampleBranches.reduce((sum, branch) => sum + branch.staff, 0))} note="across locations" color="var(--chart-4)" />
      </section>

      <section aria-label="Branch cards" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sampleBranches.map((branch) => {
          const share = Math.round((branch.monthlyRevenue / totalRevenue) * 100);

          return (
            <article
              key={branch.id}
              className="rise-in flex min-w-0 flex-col rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-[16px] font-semibold text-card-foreground">{branch.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3" />
                    {branch.address}, {branch.city}
                  </p>
                </div>
                <StatusBadge status={branch.status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Monthly revenue</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{formatKes(branch.monthlyRevenue)}</dd>
                </div>
                <div className="rounded-md border border-border p-2">
                  <dt className="text-[10px] text-muted-foreground">Stock value</dt>
                  <dd className="mt-0.5 font-semibold text-card-foreground">{formatKes(branch.stockValue)}</dd>
                </div>
              </dl>

              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-amber" style={{ width: `${Math.max(share, 5)}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">{share}% of sample revenue</p>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Users aria-hidden="true" className="size-3.5" />
                  {branch.manager} · {branch.staff} staff
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone aria-hidden="true" className="size-3.5" />
                  {branch.phone}
                </p>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
