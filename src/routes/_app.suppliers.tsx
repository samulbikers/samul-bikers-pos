import { createFileRoute } from "@tanstack/react-router";

import { SuppliersPage } from "@/features/suppliers/suppliers-page";

export const Route = createFileRoute("/_app/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers · Samul Bikers POS" },
      { name: "description", content: "Vendors, payment terms and outstanding balances." },
    ],
  }),
  component: SuppliersPage,
});
