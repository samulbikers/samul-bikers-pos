import { jsPDF } from "jspdf";

import { formatNairobiDate } from "@/lib/format";
import { printDocument } from "@/lib/printing/print-document";
import type { DbSale, DbSiteSettings } from "@/lib/supabase/types";

export type ReceiptLine = {
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptBusiness = {
  name: string;
  branch: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
};

export type ReceiptData = {
  number: string;
  date: string;
  cashier: string;
  cashierId: string;
  customer: string;
  till: string;
  business: ReceiptBusiness;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: string;
  paymentReference: string;
  status: string;
};

function money(value: number) {
  return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function settingString(settings: DbSiteSettings | null | undefined, key: string) {
  if (!settings) return "";
  const value = (settings as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function businessFromSettings(settings: DbSiteSettings | null | undefined, branch: string): ReceiptBusiness {
  const address = [
    settings?.address_line1,
    settings?.address_line2,
    settings?.city,
    settings?.county,
    settings?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name: settings?.business_name || "SAMUL BIKERS",
    branch: branch || "Main branch",
    phone: settings?.phone || settings?.phone_e164 || "—",
    email: settings?.email || "—",
    address: address || "Nairobi, Kenya",
    taxId: settingString(settings, "tax_id") || "Not configured",
  };
}

export function buildReceipt(input: {
  receipt: string;
  createdAt: string;
  cashier: string;
  cashierId?: string | undefined;
  customer: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: string;
  paymentReference?: string | undefined;
  status?: string;
  settings: DbSiteSettings | null | undefined;
  branch: string;
}): ReceiptData {
  return {
    number: input.receipt,
    date: formatNairobiDate(new Date(input.createdAt)),
    cashier: input.cashier,
    cashierId: input.cashierId ?? "",
    customer: input.customer || "Walk-in customer",
    till: "POS-01",
    business: businessFromSettings(input.settings, input.branch),
    lines: input.lines,
    subtotal: input.subtotal,
    discount: input.discount,
    vat: input.vat,
    total: input.total,
    paymentMethod: input.paymentMethod,
    paymentReference:
      input.paymentReference?.trim() ||
      `${input.paymentMethod.toUpperCase().replace(/[^A-Z]/g, "-")}-${input.receipt}`,
    status: input.status ?? "Paid",
  };
}

export function receiptFromSale(
  sale: DbSale,
  settings: DbSiteSettings | null | undefined,
  branch: string,
): ReceiptData {
  return buildReceipt({
    receipt: sale.receipt,
    createdAt: sale.created_at,
    cashier: sale.cashier,
    customer: sale.customer_name,
    lines: (sale.pos_sale_items ?? []).map((item) => ({
      title: item.product_title,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    vat: Number(sale.vat),
    total: Number(sale.total),
    paymentMethod: sale.payment_method,
    paymentReference: sale.payment_reference ?? undefined,
    status: sale.status,
    settings,
    branch: sale.branch || branch,
  });
}

export function servedBy(data: ReceiptData) {
  const firstName = data.cashier.trim().split(/\s+/)[0] || "Attendant";
  return data.cashierId ? `${firstName} (@${data.cashierId})` : firstName;
}

export function receiptToHtml(data: ReceiptData) {
  const lines = data.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.title)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${money(line.unitPrice)}</td>
        <td class="num">${money(line.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  return `<div style="text-align:center">
    <h1 style="font-size:16px;letter-spacing:.5px">${escapeHtml(data.business.name.toUpperCase())}</h1>
    <p style="font-size:11px;font-weight:600">${escapeHtml(data.business.branch)}</p>
    <p class="muted" style="font-size:10px">${escapeHtml(data.business.address)}</p>
    <p class="muted" style="font-size:10px">${escapeHtml(data.business.phone)} · ${escapeHtml(data.business.email)}</p>
    <p class="muted" style="font-size:10px">Tax PIN: ${escapeHtml(data.business.taxId)}</p>
  </div>
  <div class="rule"></div>
  <p class="center" style="font-size:12px;font-weight:700;letter-spacing:1px">OFFICIAL RECEIPT</p>
  <div class="rule"></div>
  <table>
    <tr><td class="muted">Receipt No.</td><td class="num">${escapeHtml(data.number)}</td></tr>
    <tr><td class="muted">Date &amp; time</td><td class="num">${escapeHtml(data.date)}</td></tr>
    <tr><td class="muted">Till</td><td class="num">${escapeHtml(data.till)}</td></tr>
    <tr><td class="muted">Served by</td><td class="num">${escapeHtml(servedBy(data))}</td></tr>
    <tr><td class="muted">Customer</td><td class="num">${escapeHtml(data.customer)}</td></tr>
  </table>
  <div class="rule"></div>
  <table>
    <thead><tr><th>ITEM</th><th class="num">QTY</th><th class="num">UNIT</th><th class="num">TOTAL</th></tr></thead>
    <tbody>${lines || '<tr><td colspan="4" class="muted">No line items</td></tr>'}</tbody>
  </table>
  <div class="rule"></div>
  <table>
    <tr><td class="muted">Subtotal</td><td class="num">${money(data.subtotal)}</td></tr>
    <tr><td class="muted">Discounts</td><td class="num">− ${money(data.discount)}</td></tr>
    <tr><td class="muted">VAT (16%)</td><td class="num">${money(data.vat)}</td></tr>
    <tr><td class="total">TOTAL PAID</td><td class="num total">${money(data.total)}</td></tr>
  </table>
  <div class="rule"></div>
  <table>
    <tr><td class="muted">Payment</td><td class="num">${escapeHtml(data.paymentMethod)} · ${escapeHtml(data.status.toUpperCase())}</td></tr>
    <tr><td class="muted">Reference</td><td class="num">${escapeHtml(data.paymentReference)}</td></tr>
  </table>
  <div class="rule"></div>
  <p class="center muted" style="font-size:9px;line-height:1.5">
    Returns accepted within 7 days with this receipt and original packaging.<br />
    Warranty claims require this receipt.<br /><br />
    Thank you for shopping with us — ride safe.
  </p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printReceipt(data: ReceiptData) {
  printDocument(`Receipt ${data.number}`, receiptToHtml(data));
}

export function receiptFileName(data: ReceiptData) {
  return `receipt-${data.number.replace(/[^a-z0-9-]+/gi, "-")}.pdf`;
}

export function downloadReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.business.name.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text(data.business.branch, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.business.address, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`${data.business.phone} · ${data.business.email}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`Tax PIN: ${data.business.taxId}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("OFFICIAL RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const meta: [string, string][] = [
    ["Receipt No.", data.number],
    ["Date & time", data.date],
    ["Till", data.till],
    ["Served by", servedBy(data)],
    ["Customer", data.customer],
  ];
  for (const [label, value] of meta) {
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 5;
  }

  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("ITEM", margin, y);
  doc.text("QTY", 128, y, { align: "right" });
  doc.text("UNIT", 165, y, { align: "right" });
  doc.text("TOTAL", pageWidth - margin, y, { align: "right" });
  y += 4;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");

  for (const line of data.lines) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const title = doc.splitTextToSize(line.title, 85) as string[];
    doc.text(title, margin, y);
    doc.text(String(line.quantity), 128, y, { align: "right" });
    doc.text(money(line.unitPrice), 165, y, { align: "right" });
    doc.text(money(line.lineTotal), pageWidth - margin, y, { align: "right" });
    y += Math.max(5, title.length * 4.5);
  }

  if (!data.lines.length) {
    doc.text("No line items", margin, y);
    y += 5;
  }

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  const summary: [string, string][] = [
    ["Subtotal", money(data.subtotal)],
    ["Discounts", `- ${money(data.discount)}`],
    ["VAT (16%)", money(data.vat)],
  ];
  for (const [label, value] of summary) {
    doc.text(label, 130, y);
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL PAID", 130, y + 1);
  doc.text(money(data.total), pageWidth - margin, y + 1, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.text(`Payment: ${data.paymentMethod} · ${data.status.toUpperCase()}`, margin, y);
  y += 5;
  doc.text(`Reference: ${data.paymentReference}`, margin, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text(
    "Returns accepted within 7 days with this receipt and original packaging. Warranty claims require this receipt.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );
  y += 6;
  doc.text("Thank you for shopping with us — ride safe.", margin, y);

  doc.save(receiptFileName(data));
}
