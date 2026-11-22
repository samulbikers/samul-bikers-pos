import { createFileRoute } from "@tanstack/react-router";

import { PosPage } from "@/features/pos/pos-page";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({
    meta: [
      { title: "Point of sale · Samul Bikers POS" },
      {
        name: "description",
        content: "Ring up a sale, take payment and issue an official receipt.",
      },
    ],
  }),
  component: PosPage,
});
