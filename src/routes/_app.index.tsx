import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/features/dashboard/dashboard-page";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Samul Bikers POS" },
      { name: "description", content: "Sales, stock and team activity for Samul Bikers Haven in Nairobi." },
      { property: "og:title", content: "Dashboard · Samul Bikers POS" },
      { property: "og:description", content: "Sales, stock and team activity for Samul Bikers Haven in Nairobi." },
    ],
  }),
  component: DashboardPage,
});
