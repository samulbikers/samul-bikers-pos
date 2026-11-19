import { createFileRoute } from "@tanstack/react-router";

import { CustomersPage } from "@/features/customers/customers-page";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({
    meta: [
      { title: "Customers · Samul Bikers POS" },
      { name: "description", content: "Buyer records, lifetime spend and loyalty tiers." },
    ],
  }),
  component: CustomersPage,
});
