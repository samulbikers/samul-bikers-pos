import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/features/settings/settings-page";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Samul Bikers POS" },
      { name: "description", content: "Business profile, receipt rules, payments and appearance." },
    ],
  }),
  component: SettingsPage,
});
