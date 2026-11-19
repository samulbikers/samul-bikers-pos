import { createFileRoute } from "@tanstack/react-router";

import { ReportsPage } from "@/features/reports/reports-page";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & analytics · Samul Bikers POS" },
      { name: "description", content: "Trading trends, margins and top-selling products." },
    ],
  }),
  component: ReportsPage,
});
