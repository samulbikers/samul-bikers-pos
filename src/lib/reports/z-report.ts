import type { DbSale } from "@/lib/supabase/types";

export type ZReportPaymentTotal = {
  method: string;
  receipts: number;
  amount: number;
};

export type ZReport = {
  cashier: string;
  branch: string;
  date: string;
  generatedAt: string;
  receipts: DbSale[];
  paidCount: number;
  refundedCount: number;
  gross: number;
  discounts: number;
  vat: number;
  net: number;
  refunds: number;
  averageBasket: number;
  payments: ZReportPaymentTotal[];
  firstReceiptAt: string | null;
  lastReceiptAt: string | null;
};

const nairobiDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Nairobi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const nairobiTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function nairobiDateKey(value: Date | string) {
  return nairobiDayFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatReportDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 9)));
}

function sameCashier(sale: DbSale, cashier: string) {
  return sale.cashier.trim().toLowerCase() === cashier.trim().toLowerCase();
}

export function buildZReport(input: {
  cashier: string;
  date: string;
  sales: DbSale[];
  branch?: string | undefined;
}): ZReport {
  const receipts = input.sales
    .filter((sale) => sameCashier(sale, input.cashier) && nairobiDateKey(sale.created_at) === input.date)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const paid = receipts.filter((sale) => sale.status !== "Refunded");
  const refunded = receipts.filter((sale) => sale.status === "Refunded");

  const gross = paid.reduce((sum, sale) => sum + Number(sale.subtotal), 0);
  const discounts = paid.reduce((sum, sale) => sum + Number(sale.discount), 0);
  const vat = paid.reduce((sum, sale) => sum + Number(sale.vat), 0);
  const net = paid.reduce((sum, sale) => sum + Number(sale.total), 0);
  const refunds = refunded.reduce((sum, sale) => sum + Number(sale.total), 0);

  const byMethod = new Map<string, ZReportPaymentTotal>();
  for (const sale of paid) {
    const current = byMethod.get(sale.payment_method) ?? {
      method: sale.payment_method,
      receipts: 0,
      amount: 0,
    };
    byMethod.set(sale.payment_method, {
      method: current.method,
      receipts: current.receipts + 1,
      amount: current.amount + Number(sale.total),
    });
  }

  return {
    cashier: input.cashier,
    branch: input.branch ?? paid[0]?.branch ?? "—",
    date: input.date,
    generatedAt: new Date().toISOString(),
    receipts,
    paidCount: paid.length,
    refundedCount: refunded.length,
    gross,
    discounts,
    vat,
    net,
    refunds,
    averageBasket: paid.length ? Math.round(net / paid.length) : 0,
    payments: Array.from(byMethod.values()).sort((a, b) => b.amount - a.amount),
    firstReceiptAt: receipts[0]?.created_at ?? null,
    lastReceiptAt: receipts[receipts.length - 1]?.created_at ?? null,
  };
}

function money(value: number) {
  return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

export function zReportToText(report: ZReport, businessName: string) {
  const lines = [
    businessName.toUpperCase(),
    "Z REPORT (END OF DAY)",
    "=".repeat(46),
    `Branch:        ${report.branch}`,
    `Cashier:       ${report.cashier}`,
    `Business date: ${formatReportDate(report.date)}`,
    `Generated:     ${nairobiTimeFormatter.format(new Date(report.generatedAt))}`,
    "",
    "RECEIPTS",
    `Paid receipts:     ${report.paidCount}`,
    `Refunded receipts: ${report.refundedCount}`,
    `First receipt:     ${report.firstReceiptAt ? nairobiTimeFormatter.format(new Date(report.firstReceiptAt)) : "—"}`,
    `Last receipt:      ${report.lastReceiptAt ? nairobiTimeFormatter.format(new Date(report.lastReceiptAt)) : "—"}`,
    "",
    "SALES",
    `Gross sales:  ${money(report.gross)}`,
    `Discounts:    ${money(report.discounts)}`,
    `VAT:          ${money(report.vat)}`,
    `Net sales:    ${money(report.net)}`,
    `Average sale: ${money(report.averageBasket)}`,
    "",
    "REFUNDS",
    `Refunded value: ${money(report.refunds)}`,
    "",
    "PAYMENT BREAKDOWN",
    ...(report.payments.length
      ? report.payments.map(
          (payment) =>
            `${payment.method.padEnd(10)} ${String(payment.receipts).padStart(3)} receipt(s)  ${money(payment.amount)}`,
        )
      : ["No payments recorded."]),
    "",
    "RECEIPT LIST",
    ...(report.receipts.length
      ? report.receipts.map(
          (sale) =>
            `${sale.receipt}  ${nairobiTimeFormatter.format(new Date(sale.created_at))}  ${sale.payment_method}  ${money(Number(sale.total))}${sale.status === "Refunded" ? "  REFUNDED" : ""}`,
        )
      : ["No receipts for this cashier on this date."]),
    "",
    "=".repeat(46),
    "End of Z report",
  ];

  return lines.join("\n");
}

export function zReportFileName(report: ZReport) {
  const cashier = report.cashier.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `z-report-${cashier || "cashier"}-${report.date}.txt`;
}

export function downloadZReport(report: ZReport, businessName: string) {
  const blob = new Blob([zReportToText(report, businessName)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = zReportFileName(report);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
