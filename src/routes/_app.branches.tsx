import { createFileRoute } from "@tanstack/react-router";

import { BranchesPage } from "@/features/branches/branches-page";

export const Route = createFileRoute("/_app/branches")({
  head: () => ({
    meta: [
      { title: "Branches · Samul Bikers POS" },
      { name: "description", content: "Locations, monthly revenue and stock cover per branch." },
    ],
  }),
  component: BranchesPage,
});
