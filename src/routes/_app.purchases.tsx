import { createFileRoute } from "@tanstack/react-router";

import { PurchasesPage } from "@/features/purchases/purchases-page";

export const Route = createFileRoute("/_app/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases · Samul Bikers POS" },
      { name: "description", content: "Purchase orders from draft through to goods received." },
    ],
  }),
  component: PurchasesPage,
});
