import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import logo from "@/assets/samul-bikers-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Success · Samul Bikers POS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const { ref } = Route.useSearch();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px] rounded-xl border border-emerald/30 bg-card p-6 text-center shadow-sm">
        <img src={logo} alt="Samul Bikers logo" className="mx-auto size-14 object-contain" />
        <CheckCircle2 aria-hidden="true" className="mx-auto mt-4 size-10 text-emerald" />
        <h1 className="mt-2 font-display text-[20px] font-semibold text-foreground">Payment Success!</h1>
        <p className="mt-2 text-[12px] text-muted-foreground">
          The M-Pesa payment was received. Return to the point of sale to print or download the receipt.
        </p>
        {ref ? (
          <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
            Reference: {ref}
          </p>
        ) : null}
        <Button asChild className="mt-5 h-10 w-full">
          <Link to="/pos">Return to point of sale</Link>
        </Button>
      </div>
    </main>
  );
}
