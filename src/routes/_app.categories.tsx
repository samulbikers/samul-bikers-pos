import { createFileRoute } from "@tanstack/react-router";

import { CategoriesPage } from "@/features/categories/categories-page";

export const Route = createFileRoute("/_app/categories")({
  head: () => ({
    meta: [
      { title: "Categories · Samul Bikers POS" },
      { name: "description", content: "Product groups with revenue mix and margin performance." },
    ],
  }),
  component: CategoriesPage,
});
