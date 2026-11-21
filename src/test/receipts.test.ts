import { describe, expect, it } from "vitest";

import { buildReceipt, receiptToHtml, servedBy } from "@/lib/receipts/receipt";

const settings = {
  business_name: "Samul Bikers",
  tagline: "",
  short_description: "",
  phone: "+254 715 012 019",
  phone_e164: "+254715012019",
  whatsapp: "",
  email: "info@samulbikers.co.ke",
  address_line1: "Ramogi House",
  address_line2: "3rd Floor",
  city: "Nairobi",
  county: "Nairobi",
  country: "Kenya",
};

const receipt = buildReceipt({
  receipt: "SBH-00045",
  createdAt: "2026-11-21T18:12:00+03:00",
  cashier: "Mary Wanjiku",
  cashierId: "mary",
  customer: "Kevin Mutua",
  lines: [
    { title: "45L Aluminium top box", quantity: 1, unitPrice: 17400, lineTotal: 17400 },
    { title: "Helmet lock", quantity: 2, unitPrice: 500, lineTotal: 1000 },
  ],
  subtotal: 18400,
  discount: 400,
  vat: 2880,
  total: 20880,
  paymentMethod: "M-Pesa",
  settings,
  branch: "Main branch",
});

describe("Official receipt", () => {
  it("balances subtotal minus discount plus VAT to the total paid", () => {
    expect(receipt.subtotal - receipt.discount + receipt.vat).toBe(receipt.total);
  });

  it("includes every mandatory receipt field", () => {
    const html = receiptToHtml(receipt);

    expect(html).toContain("SAMUL BIKERS");
    expect(html).toContain("Main branch");
    expect(html).toContain("+254 715 012 019");
    expect(html).toContain("info@samulbikers.co.ke");
    expect(html).toContain("OFFICIAL RECEIPT");
    expect(html).toContain("SBH-00045");
    expect(html).toContain("Served by");
    expect(html).toContain("45L Aluminium top box");
    expect(html).toContain("Subtotal");
    expect(html).toContain("VAT (16%)");
    expect(html).toContain("TOTAL PAID");
    expect(html).toContain("M-Pesa");
    expect(html).toContain("Reference");
    expect(html).toContain("Returns accepted");
  });

  it("shows the attendant's first name with their staff username", () => {
    expect(servedBy(receipt)).toBe("Mary (@mary)");
  });

  it("uses the saved M-Pesa reference on the receipt", () => {
    const paid = buildReceipt({
      receipt: "SBH-00046",
      createdAt: "2026-11-22T00:40:00+03:00",
      cashier: "Miriam Wambui",
      customer: "Walk-in customer",
      lines: [{ title: "45L Aluminium top box", quantity: 1, unitPrice: 17400, lineTotal: 17400 }],
      subtotal: 17400,
      discount: 0,
      vat: 2784,
      total: 20184,
      paymentMethod: "M-Pesa",
      paymentReference: "TCT3K99UFZ",
      settings,
      branch: "Main branch",
    });

    expect(receiptToHtml(paid)).toContain("TCT3K99UFZ");
  });
});
