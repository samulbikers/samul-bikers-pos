import { CircleDollarSign, Pencil, Plus, Receipt, Trash2, TrendingDown, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProgressRow } from "@/components/data/charts";
import { ConfirmDialog, FormDialog, type FormField, type FormValues } from "@/components/data/form-dialog";
import { DataTable } from "@/components/data/data-table";
import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
import { SectionCard } from "@/components/data/section-card";
import { StatCard } from "@/components/data/stat-card";
import { FilterSelect, SearchField, Toolbar } from "@/components/data/toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/lib/supabase/queries";
import {
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
} from "@/lib/supabase/mutations";
import type { DbExpense } from "@/lib/supabase/types";
import { formatDate, formatKes } from "@/lib/format";

const expenseCategories = ["Rent", "Salaries", "Utilities", "Transport", "Marketing", "Supplies", "Licences", "Other"] as const;
const categoryOptions = ["All categories", ...expenseCategories] as const;

const fields: readonly FormField[] = [
  { key: "reference", label: "Reference", placeholder: "EXP-0001" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: expenseCategories.map((category) => ({ value: category, label: category })),
  },
  { key: "description", label: "Description", full: true, placeholder: "What the money was spent on" },
  { key: "amount", label: "Amount (KES)", type: "number", step: "0.01" },
  { key: "spent_on", label: "Date", type: "date" },
  { key: "paid_by", label: "Paid by", placeholder: "Staff member" },
  { key: "approved_by", label: "Approved by", placeholder: "Manager" },
];

const today = () => new Date().toISOString().slice(0, 10);
const emptyValues: FormValues = {
  reference: "",
  category: "Other",
  description: "",
  amount: "",
  spent_on: today(),
  paid_by: "",
  approved_by: "",
};

export function ExpensesPage() {
  const expensesQuery = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(categoryOptions[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbExpense | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [deleting, setDeleting] = useState<DbExpense | null>(null);

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

  const change = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setValues({ ...emptyValues, spent_on: today() });
    setDialogOpen(true);
  };

  const openEdit = (expense: DbExpense) => {
    setEditing(expense);
    setValues({
      reference: expense.reference,
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      spent_on: expense.spent_on,
      paid_by: expense.paid_by,
      approved_by: expense.approved_by,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!values["reference"]?.trim() || !values["description"]?.trim() || !values["amount"]) {
      toast.error("Reference, description and amount are required");
      return;
    }

    const payload = {
      reference: values["reference"].trim(),
      category: (values["category"] || "Other") as DbExpense["category"],
      description: values["description"].trim(),
      amount: Number(values["amount"]),
      paid_by: values["paid_by"]?.trim() || "—",
      approved_by: values["approved_by"]?.trim() || "—",
      spent_on: values["spent_on"] || today(),
    };

    try {
      if (editing) {
        await updateExpense.mutateAsync({ id: editing.id, ...payload });
        toast.success("Expense updated", { description: `${payload.reference} saved to Supabase.` });
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Expense added", { description: `${payload.reference} saved to Supabase.` });
      }
      setDialogOpen(false);
      setEditing(null);
      setValues(emptyValues);
    } catch (error) {
      toast.error("Could not save the expense", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteExpense.mutateAsync(deleting.id);
      toast.success("Expense deleted", { description: `${deleting.reference} removed from Supabase.` });
      setDeleting(null);
    } catch (error) {
      toast.error("Could not delete the expense", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

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
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-3.5" />
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
                description="Record your first expense to start tracking operating costs."
                action={
                  <Button type="button" size="sm" className="mt-2 h-8" onClick={openCreate}>
                    Record expense
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable
              rows={rows}
              getRowId={(expense) => expense.id}
              emptyMessage="No expenses match these filters."
              caption="Expense register"
              minWidth="900px"
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
                {
                  key: "actions",
                  header: "ACTIONS",
                  align: "right",
                  render: (expense) => (
                    <span className="flex items-center justify-end gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => openEdit(expense)}>
                        <Pencil aria-hidden="true" className="size-3" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[10px] text-destructive"
                        onClick={() => setDeleting(expense)}
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

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Update expense" : "Record expense"}
        description="Saved to the pos_expenses table in Supabase."
        fields={fields}
        values={values}
        onChange={change}
        onSubmit={submit}
        pending={createExpense.isPending || updateExpense.isPending}
        submitLabel={editing ? "Save changes" : "Save expense"}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => (open ? null : setDeleting(null))}
        title="Delete expense?"
        description={`Remove ${deleting?.reference ?? "this expense"} from the register? This cannot be undone.`}
        pending={deleteExpense.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
