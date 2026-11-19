import { createFileRoute } from "@tanstack/react-router";

import { SalesPage } from "@/features/sales/sales-page";

export const Route = createFileRoute("/_app/sales")({
  head: () => ({
    meta: [
      { title: "Sales · Samul Bikers POS" },
      { name: "description", content: "Receipts, refunds and daily takings at the counter." },
    ],
  }),
  component: SalesPage,
});
