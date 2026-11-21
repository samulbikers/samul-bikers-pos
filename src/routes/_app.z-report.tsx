import { createFileRoute } from "@tanstack/react-router";

import { ZReportPage } from "@/features/reports/z-report-page";

export const Route = createFileRoute("/_app/z-report")({
  validateSearch: (search: Record<string, unknown>) => ({
    cashier: typeof search["cashier"] === "string" ? search["cashier"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Z report · Samul Bikers POS" },
      { name: "description", content: "End-of-day takings per cashier, ready to download." },
    ],
  }),
  component: ZReportRoute,
});

function ZReportRoute() {
  const { cashier } = Route.useSearch();
  return <ZReportPage initialCashier={cashier} />;
}
