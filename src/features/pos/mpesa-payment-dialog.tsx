import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKes } from "@/lib/format";
import {
  buildPayHeroPaymentUrl,
  createPaymentReference,
  formatPhoneDisplay,
  normalizePhone,
  paymentResultFromUrl,
  type PayHeroPayment,
} from "@/lib/payments/payhero";

export type PaidPayment = {
  reference: string;
  providerReference?: string | undefined;
  manual: boolean;
};

type PaymentStatus = "idle" | "waiting" | "success" | "failed";

export function MpesaPaymentDialog({
  open,
  onOpenChange,
  amount,
  customerName,
  onPaid,
  recording,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerName: string;
  onPaid: (payment: PaidPayment) => Promise<void>;
  recording?: boolean;
}) {
  const [mode, setMode] = useState<"prompt" | "manual">("prompt");
  const [phone, setPhone] = useState("");
  const [manualReference, setManualReference] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const handledRef = useRef(false);
  const referenceRef = useRef("");
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const onPaidRef = useRef(onPaid);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onPaidRef.current = onPaid;
    onOpenChangeRef.current = onOpenChange;
  }, [onPaid, onOpenChange]);

  const cleanup = useCallback(() => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (messageHandlerRef.current) {
      window.removeEventListener("message", messageHandlerRef.current);
    }
    pollRef.current = null;
    timeoutRef.current = null;
    messageHandlerRef.current = null;

    if (popupRef.current) {
      try {
        popupRef.current.close();
      } catch {
        // Ignore cross-origin close failures.
      }
      popupRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) return;
    cleanup();
    handledRef.current = false;
    setMode("prompt");
    setPhone("");
    setManualReference("");
    setStatus("idle");
    setMessage("");
    setError("");
  }, [open, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  const completePayment = useCallback(
    async (payment: PaidPayment) => {
      if (handledRef.current) return;
      handledRef.current = true;
      setStatus("success");
      setMessage("Payment Success!");
      setError("");

      try {
        await onPaidRef.current(payment);
        onOpenChangeRef.current(false);
      } catch (paymentError) {
        setStatus("failed");
        setMessage(
          paymentError instanceof Error
            ? `Payment received, but the sale could not be saved: ${paymentError.message}`
            : "Payment received, but the sale could not be saved. Please contact support.",
        );
      }
    },
    [],
  );

  const failPayment = useCallback(
    (reason?: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      cleanup();
      setStatus("failed");
      setMessage(reason || "Payment Failed! Please Try Again.");
    },
    [cleanup],
  );

  const handlePayHeroOutcome = useCallback(
    (payment: PayHeroPayment) => {
      if (payment.paymentSuccess) {
        void completePayment({
          reference: referenceRef.current || payment.user_reference || createPaymentReference(),
          providerReference: payment.providerReference ?? payment.reference,
          manual: false,
        });
        return;
      }
      failPayment();
    },
    [completePayment, failPayment],
  );

  const promptPayment = () => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Enter a valid M-Pesa number, e.g. 0712 345 678.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("This sale has no payable amount.");
      return;
    }

    setError("");
    setStatus("waiting");
    setMessage(`Waiting for ${formatPhoneDisplay(normalized)} to enter their M-Pesa PIN...`);
    handledRef.current = false;
    referenceRef.current = createPaymentReference();

    const checkoutUrl = buildPayHeroPaymentUrl({
      reference: referenceRef.current,
      amount,
      phone: normalized,
      name: customerName,
    });

    const popup = window.open(
      checkoutUrl,
      "payhero-mpesa",
      "popup=yes,width=480,height=760,noopener=no",
    );

    if (!popup) {
      failPayment("Allow pop-ups for this site, then try the payment again.");
      return;
    }

    popupRef.current = popup;

    const handler = (event: MessageEvent) => {
      const data = event.data as unknown;
      if (!data || typeof data !== "object" || !("paymentSuccess" in data)) return;
      const payload = data as PayHeroPayment;
      if (payload.user_reference && payload.user_reference !== referenceRef.current) return;
      handlePayHeroOutcome(payload);
    };
    window.addEventListener("message", handler);
    messageHandlerRef.current = handler;

    pollRef.current = window.setInterval(() => {
      const activePopup = popupRef.current;
      if (!activePopup) return;

      if (activePopup.closed) {
        failPayment();
        return;
      }

      try {
        const result = paymentResultFromUrl(activePopup.location.href, window.location.origin);
        if (result) {
          if (result.success) {
            void completePayment({
              reference: result.reference || referenceRef.current,
              manual: false,
            });
          } else {
            failPayment();
          }
        }
      } catch {
        // Still on PayHero's origin; keep polling.
      }
    }, 700);

    timeoutRef.current = window.setTimeout(() => {
      failPayment("Payment timed out. Please try again.");
    }, 180_000);
  };

  const confirmManual = async () => {
    const reference = manualReference.trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,24}$/.test(reference)) {
      setError("Enter the M-Pesa reference code from the customer's SMS.");
      return;
    }

    setError("");
    handledRef.current = false;
    await completePayment({ reference, manual: true });
  };

  const cancelWaiting = () => {
    cleanup();
    handledRef.current = true;
    setStatus("idle");
    setMessage("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : onOpenChange(false))}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[440px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Smartphone aria-hidden="true" className="size-4 text-emerald" />
            M-Pesa payment
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {customerName} · {formatKes(amount)}
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="rounded-lg border border-emerald/30 bg-emerald-subtle p-5 text-center">
            <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-emerald" />
            <p className="mt-2 text-[15px] font-semibold text-emerald">Payment Success!</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Printing and downloading the receipt...
            </p>
          </div>
        ) : status === "failed" ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <XCircle aria-hidden="true" className="mx-auto size-9 text-destructive" />
              <p className="mt-2 text-[14px] font-semibold text-destructive">
                Payment Failed! Please Try Again.
              </p>
              {message ? <p className="mt-1 text-[10px] text-muted-foreground">{message}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                  setError("");
                }}
              >
                Try again
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Back to POS
              </Button>
            </div>
          </div>
        ) : status === "waiting" ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber/40 bg-amber/5 p-4 text-center">
              <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-amber" />
              <p className="mt-2 text-[12px] font-medium text-foreground">Waiting for payment...</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{message}</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={cancelWaiting}>
              Stop waiting · return to unpaid invoice
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 rounded-md bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("prompt")}
                aria-pressed={mode === "prompt"}
                className={`h-8 rounded text-[11px] font-medium transition-colors ${
                  mode === "prompt" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Prompt customer
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                aria-pressed={mode === "manual"}
                className={`h-8 rounded text-[11px] font-medium transition-colors ${
                  mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Manual pay
              </button>
            </div>

            {mode === "prompt" ? (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mpesa-phone" className="text-[11px]">
                    Customer M-Pesa number
                  </Label>
                  <Input
                    id="mpesa-phone"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0712 345 678"
                    className="h-10 text-[13px]"
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground">
                    The customer receives an STK push and enters their M-Pesa PIN on their phone.
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-10 w-full gap-2 text-[12px]"
                  onClick={promptPayment}
                  disabled={recording}
                >
                  <Smartphone aria-hidden="true" className="size-4" />
                  Prompt to pay {formatKes(amount)}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mpesa-reference" className="text-[11px]">
                    M-Pesa reference code
                  </Label>
                  <Input
                    id="mpesa-reference"
                    value={manualReference}
                    onChange={(event) => setManualReference(event.target.value.toUpperCase())}
                    placeholder="e.g. TCT3K99UFZ"
                    className="h-10 text-[13px] tracking-wide"
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Enter the code from the customer&apos;s M-Pesa confirmation SMS, then issue the receipt.
                  </p>
                </div>
                <Button
                  type="button"
                  className="h-10 w-full gap-2 text-[12px]"
                  onClick={() => void confirmManual()}
                  disabled={recording}
                >
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Confirm manual payment
                </Button>
              </div>
            )}
          </>
        )}

        {error ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[10px] text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-[11px]"
            onClick={() => onOpenChange(false)}
            disabled={status === "waiting" || status === "success" || recording}
          >
            Back to POS · keep invoice unpaid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
