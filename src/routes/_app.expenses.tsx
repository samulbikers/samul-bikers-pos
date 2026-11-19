import { createFileRoute } from "@tanstack/react-router";

import { ExpensesPage } from "@/features/expenses/expenses-page";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Samul Bikers POS" },
      { name: "description", content: "Operating costs grouped by category and approver." },
    ],
  }),
  component: ExpensesPage,
});
