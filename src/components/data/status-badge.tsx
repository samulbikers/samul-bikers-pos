type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-subtle text-emerald",
  warning: "bg-amber/10 text-amber",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-blue-subtle text-blue",
  neutral: "bg-muted text-muted-foreground",
};

const statusTones: Record<string, Tone> = {
  Paid: "success",
  "Part paid": "warning",
  Refunded: "danger",
  "In stock": "success",
  "Low stock": "warning",
  "Out of stock": "danger",
  Draft: "neutral",
  Ordered: "info",
  "In transit": "warning",
  Received: "success",
  Cancelled: "danger",
  Active: "success",
  "On leave": "warning",
  Inactive: "neutral",
  Open: "success",
  "Closing soon": "warning",
  Closed: "neutral",
  New: "info",
  Regular: "neutral",
  Loyal: "success",
  Trade: "warning",
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const tone = statusTones[status] ?? "neutral";
  return (
    <span
      className={`inline-flex min-h-[23px] items-center gap-1 whitespace-nowrap rounded-[5px] px-2 text-[10px] font-medium ${toneClasses[tone]} ${className}`}
    >
      {status}
    </span>
  );
}

export function PaymentBadge({ method }: { method: "M-Pesa" | "Cash" | "Card" }) {
  const tone: Tone = method === "M-Pesa" ? "success" : method === "Card" ? "info" : "neutral";
  return (
    <span
      className={`inline-flex min-h-[23px] items-center rounded-[5px] px-2 text-[10px] font-medium ${toneClasses[tone]}`}
    >
      {method}
    </span>
  );
}
