import { createFileRoute } from "@tanstack/react-router";

import { InventoryPage } from "@/features/inventory/inventory-page";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · Samul Bikers POS" },
      { name: "description", content: "Stock levels, reorder alerts and recent stock movements." },
    ],
  }),
  component: InventoryPage,
});
