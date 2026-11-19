import { createFileRoute } from "@tanstack/react-router";

import { ProductsPage } from "@/features/products/products-page";

export const Route = createFileRoute("/_app/products")({
  head: () => ({
    meta: [
      { title: "Products · Samul Bikers POS" },
      { name: "description", content: "Catalogue, pricing and margins for every product the shop sells." },
    ],
  }),
  component: ProductsPage,
});
