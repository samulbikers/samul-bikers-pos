import { CircleDollarSign, Plus, Receipt, TrendingDown, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProgressRow } from "@/components/data/charts";
import { DataTable } from "@/components/data/data-table";
import { PreviewBadge } from "@/components/data/preview-badge";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { expenseSplit, sampleExpenses } from "@/data/sample/operations";
import { formatKes } from "@/lib/format";

const categoryOptions = ["All categories", ...expenseSplit.map((item) => item.category)] as const;

export function ExpensesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(categoryOptions[0]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleExpenses.filter((expense) => {
      const matchesQuery =
        !needle || `${expense.reference} ${expense.description} ${expense.approvedBy}`.toLowerCase().includes(needle);
      const matchesCategory = category === categoryOptions[0] || expense.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const total = sampleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const largest = sampleExpenses.reduce((max, expense) => (expense.amount > max.amount ? expense : max), sampleExpenses[0]!);
  const splitTotal = expenseSplit.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Operating costs paid this month, grouped by category and approver."
        meta={<PreviewBadge />}
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => toast.info("Expense capture is disabled in the preview workspace.")}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Record expense
          </Button>
        }
      />

      <section aria-label="Expense summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]">
        <StatCard icon={Wallet} title="Total expenses" value={formatKes(total)} note={`${sampleExpenses.length} sample entries`} color="var(--chart-1)" />
        <StatCard icon={TrendingDown} title="Largest category" value="Salaries" change="57%" note="of sample spend" color="var(--chart-2)" trend="down" />
        <StatCard icon={Receipt} title="Largest entry" value={formatKes(largest.amount)} note={largest.category.toLowerCase()} color="var(--chart-4)" />
        <StatCard icon={CircleDollarSign} title="Average entry" value={formatKes(Math.round(total / sampleExpenses.length))} note="per expense" color="var(--chart-3)" />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
          <div className="px-4 pb-2 pt-4 sm:px-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Expense register</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">All sample costs recorded in November.</p>
          </div>
          <Toolbar>
            <SearchField value={query} onChange={setQuery} label="Search expenses" placeholder="Search reference or description" className="w-full sm:w-64" />
            <FilterSelect label="Filter by expense category" value={category} onChange={setCategory} options={categoryOptions} />
            <span className="ml-auto text-[10px] text-muted-foreground">{rows.length} entries</span>
          </Toolbar>
          <DataTable
            rows={rows}
            getRowId={(expense) => expense.id}
            emptyMessage="No expenses match these filters."
            caption="Expense register"
            minWidth="700px"
            columns={[
              { key: "reference", header: "REFERENCE", render: (expense) => <span className="whitespace-nowrap font-medium text-primary">{expense.reference}</span> },
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
              { key: "date", header: "DATE", render: (expense) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{expense.date}</span> },
              { key: "paid", header: "PAID BY", render: (expense) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{expense.paidBy}</span> },
              { key: "approved", header: "APPROVED BY", render: (expense) => <span className="whitespace-nowrap text-[10px] text-muted-foreground">{expense.approvedBy}</span> },
              { key: "amount", header: "AMOUNT", align: "right", render: (expense) => <span className="whitespace-nowrap font-semibold">{formatKes(expense.amount)}</span> },
            ]}
          />
          <div className="border-t border-border px-5 py-[11px] text-[10px] text-muted-foreground">
            Preview register · Not linked to accounting
          </div>
        </section>

        <SectionCard title="Spend by category" description="Share of sample monthly costs" footer="Category totals are illustrative.">
          <ul className="space-y-3">
            {expenseSplit.map((item, index) => (
              <ProgressRow
                key={item.category}
                label={item.category}
                percent={Math.round((item.amount / splitTotal) * 100)}
                value={formatKes(item.amount)}
                color={`var(--chart-${(index % 5) + 1})`}
              />
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
