import { jsPDF } from "jspdf";

import { printDocument } from "@/lib/printing/print-document";
import { formatReportDate, type ZReport } from "@/lib/reports/z-report";

function money(value: number) {
  return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function zReportToHtml(report: ZReport, businessName: string) {
  const payments = report.payments
    .map(
      (payment) =>
        `<tr><td>${escapeHtml(payment.method)}</td><td class="num">${payment.receipts}</td><td class="num">${money(payment.amount)}</td></tr>`,
    )
    .join("");
  const receipts = report.receipts
    .map(
      (sale) =>
        `<tr><td>${escapeHtml(sale.receipt)}</td><td>${escapeHtml(sale.payment_method)}</td><td>${escapeHtml(sale.status)}</td><td class="num">${money(Number(sale.total))}</td></tr>`,
    )
    .join("");

  return `<div style="text-align:center">
    <h1 style="font-size:15px">${escapeHtml(businessName.toUpperCase())}</h1>
    <p style="font-size:11px;font-weight:700;letter-spacing:1px">Z REPORT (END OF DAY)</p>
  </div>
  <div class="rule"></div>
  <table>
    <tr><td class="muted">Branch</td><td class="num">${escapeHtml(report.branch)}</td></tr>
    <tr><td class="muted">Cashier</td><td class="num">${escapeHtml(report.cashier)}</td></tr>
    <tr><td class="muted">Business date</td><td class="num">${formatReportDate(report.date)}</td></tr>
    <tr><td class="muted">Generated</td><td class="num">${new Date(report.generatedAt).toLocaleString("en-KE")}</td></tr>
  </table>
  <div class="rule"></div>
  <table>
    <tr><td class="muted">Paid receipts</td><td class="num">${report.paidCount}</td></tr>
    <tr><td class="muted">Refunded receipts</td><td class="num">${report.refundedCount}</td></tr>
  </table>
  <div class="rule"></div>
  <h2 style="font-size:11px">SALES</h2>
  <table>
    <tr><td class="muted">Gross sales</td><td class="num">${money(report.gross)}</td></tr>
    <tr><td class="muted">Discounts</td><td class="num">${money(report.discounts)}</td></tr>
    <tr><td class="muted">VAT</td><td class="num">${money(report.vat)}</td></tr>
    <tr><td class="muted">Refunds</td><td class="num">${money(report.refunds)}</td></tr>
    <tr><td class="total">NET SALES</td><td class="num total">${money(report.net)}</td></tr>
  </table>
  <div class="rule"></div>
  <h2 style="font-size:11px">PAYMENT BREAKDOWN</h2>
  <table>
    <thead><tr><th>METHOD</th><th class="num">RECEIPTS</th><th class="num">AMOUNT</th></tr></thead>
    <tbody>${payments || '<tr><td colspan="3" class="muted">No payments recorded</td></tr>'}</tbody>
  </table>
  <div class="rule"></div>
  <h2 style="font-size:11px">RECEIPTS</h2>
  <table>
    <thead><tr><th>RECEIPT</th><th>PAYMENT</th><th>STATUS</th><th class="num">TOTAL</th></tr></thead>
    <tbody>${receipts || '<tr><td colspan="4" class="muted">No receipts for this date</td></tr>'}</tbody>
  </table>
  <div class="rule"></div>
  <p class="center muted" style="font-size:9px">Cashier signature: ______________________</p>
  <p class="center muted" style="font-size:9px;margin-top:10px">Manager signature: ______________________</p>`;
}

export function printZReport(report: ZReport, businessName: string) {
  printDocument(`Z report ${report.date}`, zReportToHtml(report, businessName));
}

export function zReportPdfFileName(report: ZReport) {
  const cashier = report.cashier.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `z-report-${cashier || "cashier"}-${report.date}.pdf`;
}

export function downloadZReportPdf(report: ZReport, businessName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(businessName.toUpperCase(), width / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(11);
  doc.text("Z REPORT (END OF DAY)", width / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(margin, y, width - margin, y);
  y += 6;

  const meta: [string, string][] = [
    ["Branch", report.branch],
    ["Cashier", report.cashier],
    ["Business date", formatReportDate(report.date)],
    ["Generated", new Date(report.generatedAt).toLocaleString("en-KE")],
    ["Paid receipts", String(report.paidCount)],
    ["Refunded receipts", String(report.refundedCount)],
  ];
  for (const [label, value] of meta) {
    doc.text(label, margin, y);
    doc.text(value, width - margin, y, { align: "right" });
    y += 5;
  }

  y += 2;
  doc.line(margin, y, width - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("SALES", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const totals: [string, string][] = [
    ["Gross sales", money(report.gross)],
    ["Discounts", money(report.discounts)],
    ["VAT", money(report.vat)],
    ["Refunds", money(report.refunds)],
  ];
  for (const [label, value] of totals) {
    doc.text(label, margin, y);
    doc.text(value, width - margin, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NET SALES", margin, y + 1);
  doc.text(money(report.net), width - margin, y + 1, { align: "right" });
  y += 9;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.line(margin, y, width - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT BREAKDOWN", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  for (const payment of report.payments) {
    doc.text(`${payment.method} · ${payment.receipts} receipt(s)`, margin, y);
    doc.text(money(payment.amount), width - margin, y, { align: "right" });
    y += 5;
  }
  if (!report.payments.length) {
    doc.text("No payments recorded", margin, y);
    y += 5;
  }

  y += 2;
  doc.line(margin, y, width - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPTS", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  for (const sale of report.receipts) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${sale.receipt} · ${sale.payment_method} · ${sale.status}`, margin, y);
    doc.text(money(Number(sale.total)), width - margin, y, { align: "right" });
    y += 5;
  }
  if (!report.receipts.length) {
    doc.text("No receipts for this date", margin, y);
    y += 5;
  }

  y += 10;
  if (y < 260) {
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text("Cashier signature: ______________________", margin, y);
    y += 8;
    doc.text("Manager signature: ______________________", margin, y);
  }

  doc.save(zReportPdfFileName(report));
}
