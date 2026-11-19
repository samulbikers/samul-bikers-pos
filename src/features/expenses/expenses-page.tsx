import { CircleDollarSign, Info, Receipt, TrendingDown, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { ProgressRow } from "@/components/data/charts";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/lib/supabase/queries";
import { formatDate, formatKes } from "@/lib/format";

const categoryOptions = ["All categories", "Rent", "Salaries", "Utilities", "Transport", "Marketing", "Supplies", "Licences", "Other"] as const;

export function ExpensesPage() {
  const expensesQuery = useExpenses();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(categoryOptions[0]);

  const expenses = expensesQuery.data ?? [];

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesQuery =
        !needle ||
        `${expense.reference} ${expense.description} ${expense.approved_by}`.toLowerCase().includes(needle);
      const matchesCategory = category === categoryOptions[0] || expense.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [expenses, query, category]);

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const split = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of expenses) {
      map.set(expense.category, (map.get(expense.category) ?? 0) + Number(expense.amount));
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const largest = expenses.reduce<(typeof expenses)[number] | null>(
    (max, expense) => (max === null || Number(expense.amount) > Number(max.amount) ? expense : max),
    null,
  );

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Operating costs stored in Supabase, grouped by category and approver."
        meta={
          expensesQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Live from Supabase
            </span>
          ) : null
        }
        actions={
          <Button type="button" size="sm" variant="outline" className="h-9 gap-1.5" disabled title="Expense capture is not enabled in this workspace">
            <Info aria-hidden="true" className="size-3.5" />
            Record expense
          </Button>
        }
      />

      <SupabaseNotice />
      {expensesQuery.isError && <QueryError error={expensesQuery.error} label="Could not load expenses" />}

      <section aria-label="Expense summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Wallet} title="Total expenses" value={formatKes(total)} note={`${expenses.length} entries`} color="var(--chart-1)" />
        <StatCard
          icon={TrendingDown}
          title="Largest category"
          value={split[0]?.name ?? "—"}
          note={split[0] ? `${Math.round((split[0].amount / Math.max(total, 1)) * 100)}% of spend` : "no entries yet"}
          color="var(--chart-2)"
          trend="down"
        />
        <StatCard
          icon={Receipt}
          title="Largest entry"
          value={largest ? formatKes(Number(largest.amount)) : "—"}
          note={largest ? largest.category.toLowerCase() : "no entries yet"}
          color="var(--chart-4)"
        />
        <StatCard
          icon={CircleDollarSign}
          title="Average entry"
          value={expenses.length ? formatKes(Math.round(total / expenses.length)) : "—"}
          note="per expense"
          color="var(--chart-3)"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Expense register</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">All recorded operating costs.</p>
          </div>
          <Toolbar>
            <SearchField value={query} onChange={setQuery} label="Search expenses" placeholder="Search reference or description" className="w-full sm:w-64" />
            <FilterSelect label="Filter by expense category" value={category} onChange={setCategory} options={categoryOptions} />
            <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} entries</span>
          </Toolbar>

          {expensesQuery.isLoading ? (
            <div className="px-4 pb-4 sm:px-5">
              <QueryLoading label="Loading expenses..." />
            </div>
          ) : !expenses.length ? (
            <div className="px-4 pb-4 sm:px-5">
              <EmptyState
                title="No expenses recorded"
                description="Expenses added to the pos_expenses table will be summarised here."
              />
            </div>
          ) : (
            <DataTable
              rows={rows}
              getRowId={(expense) => expense.id}
              emptyMessage="No expenses match these filters."
              caption="Expense register"
              minWidth="720px"
              columns={[
                {
                  key: "reference",
                  header: "REFERENCE",
                  render: (expense) => <span className="whitespace-nowrap font-medium text-primary">{expense.reference}</span>,
                },
                {
                  key: "description",
                  header: "DESCRIPTION",
                  render: (expense) => (
                    <span className="min-w-0">
                      <span className="block max-w-[230px] truncate">{expense.description}</span>
                      <span className="block text-[10px] text-muted-foreground">{expense.category}</span>
                    </span>
                  ),
                },
                {
                  key: "date",
                  header: "DATE",
                  render: (expense) => (
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">{formatDate(expense.spent_on)}</span>
                  ),
                },
                {
                  key: "paid",
                  header: "PAID BY",
                  render: (expense) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{expense.paid_by}</span>,
                },
                {
                  key: "approved",
                  header: "APPROVED BY",
                  render: (expense) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{expense.approved_by}</span>,
                },
                {
                  key: "amount",
                  header: "AMOUNT",
                  align: "right",
                  render: (expense) => <span className="whitespace-nowrap font-semibold">{formatKes(Number(expense.amount))}</span>,
                },
              ]}
            />
          )}
        </section>

        <SectionCard title="Spend by category" description="Share of recorded costs" footer="Calculated from Supabase records.">
          {split.length ? (
            <ul className="space-y-3">
              {split.map((item, index) => (
                <ProgressRow
                  key={item.name}
                  label={item.name}
                  percent={Math.round((item.amount / Math.max(total, 1)) * 100)}
                  value={formatKes(item.amount)}
                  color={`var(--chart-${(index % 5) + 1})`}
                />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing to chart yet" description="Recorded expenses will be grouped by category." />
          )}
        </SectionCard>
      </div>
    </>
  );
}
