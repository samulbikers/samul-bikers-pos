import { describe, expect, it, vi } from "vitest";

import type { DbSale } from "@/lib/supabase/types";
import {
  buildZReport,
  downloadZReport,
  nairobiDateKey,
  zReportFileName,
  zReportToText,
} from "@/lib/reports/z-report";

function sale(overrides: Partial<DbSale>): DbSale {
  return {
    id: "sale-1",
    receipt: "SB-0001",
    customer_id: null,
    customer_name: "Walk-in customer",
    cashier: "Lucy Achieng",
    branch: "Main branch",
    payment_method: "M-Pesa",
    subtotal: 1000,
    discount: 0,
    vat: 160,
    total: 1160,
    status: "Paid",
    created_at: "2026-11-21T10:00:00+03:00",
    ...overrides,
  };
}

describe("Z report", () => {
  it("uses the Nairobi business date for a sale", () => {
    expect(nairobiDateKey("2026-11-21T22:30:00Z")).toBe("2026-11-22");
  });

  it("only includes the selected cashier's receipts for the selected date", () => {
    const report = buildZReport({
      cashier: "Lucy Achieng",
      date: "2026-11-21",
      sales: [
        sale({ id: "a", total: 1160 }),
        sale({ id: "b", cashier: "Esther Njoki", total: 500 }),
        sale({ id: "c", created_at: "2026-11-20T10:00:00+03:00", total: 900 }),
        sale({ id: "d", receipt: "SB-0002", payment_method: "Cash", subtotal: 2000, vat: 320, total: 2320 }),
      ],
    });

    expect(report.receipts.map((entry) => entry.id)).toEqual(["a", "d"]);
    expect(report.paidCount).toBe(2);
    expect(report.net).toBe(3480);
    expect(report.gross).toBe(3000);
    expect(report.vat).toBe(480);
    expect(report.averageBasket).toBe(1740);
    expect(report.payments).toEqual([
      { method: "Cash", receipts: 1, amount: 2320 },
      { method: "M-Pesa", receipts: 1, amount: 1160 },
    ]);
  });

  it("reports refunds separately from paid sales", () => {
    const report = buildZReport({
      cashier: "Lucy Achieng",
      date: "2026-11-21",
      sales: [
        sale({ id: "paid", total: 1160 }),
        sale({ id: "refund", receipt: "SB-0003", total: 580, status: "Refunded" }),
      ],
    });

    expect(report.paidCount).toBe(1);
    expect(report.refundedCount).toBe(1);
    expect(report.net).toBe(1160);
    expect(report.refunds).toBe(580);
  });

  it("renders a downloadable text report with the cashier and totals", () => {
    const report = buildZReport({
      cashier: "Lucy Achieng",
      date: "2026-11-21",
      branch: "Main branch",
      sales: [sale({})],
    });
    const text = zReportToText(report, "Samul Bikers");

    expect(text).toContain("SAMUL BIKERS");
    expect(text).toContain("Cashier:       Lucy Achieng");
    expect(text).toContain("Business date: 21 Nov 2026");
    expect(text).toContain("Net sales:    KES 1,160");
    expect(zReportFileName(report)).toBe("z-report-lucy-achieng-2026-11-21.txt");
  });

  it("downloads the report through a temporary text file", () => {
    const report = buildZReport({
      cashier: "Lucy Achieng",
      date: "2026-11-21",
      sales: [sale({})],
    });
    const createObjectURL = vi.fn((_blob: Blob) => "blob:z-report");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    let downloadName = "";
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    downloadZReport(report, "Samul Bikers");

    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(downloadName).toBe(zReportFileName(report));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:z-report");

    click.mockRestore();
  });
});
