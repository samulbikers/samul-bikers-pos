import { createFileRoute } from "@tanstack/react-router";

import { StaffPage } from "@/features/staff/staff-page";

export const Route = createFileRoute("/_app/staff")({
  head: () => ({
    meta: [
      { title: "Staff & users · Samul Bikers POS" },
      { name: "description", content: "Team roles, branches, shifts and attributed sales." },
    ],
  }),
  component: StaffPage,
});
