import { Link, createFileRoute } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

import logo from "@/assets/samul-bikers-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/failed")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Failed · Samul Bikers POS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutFailedPage,
});

function CheckoutFailedPage() {
  const { ref } = Route.useSearch();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px] rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
        <img src={logo} alt="Samul Bikers logo" className="mx-auto size-14 object-contain" />
        <XCircle aria-hidden="true" className="mx-auto mt-4 size-10 text-destructive" />
        <h1 className="mt-2 font-display text-[20px] font-semibold text-foreground">
          Payment Failed! Please Try Again.
        </h1>
        <p className="mt-2 text-[12px] text-muted-foreground">
          No payment was taken. Return to the POS; the invoice is still unpaid and ready to retry.
        </p>
        {ref ? (
          <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
            Reference: {ref}
          </p>
        ) : null}
        <Button asChild className="mt-5 h-10 w-full">
          <Link to="/pos">Back to unpaid invoice</Link>
        </Button>
      </div>
    </main>
  );
}
