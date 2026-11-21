import { describe, expect, it } from "vitest";

import {
  buildPayHeroPaymentUrl,
  createPaymentReference,
  normalizePhone,
  paymentResultFromUrl,
} from "@/lib/payments/payhero";

describe("PayHero M-Pesa helpers", () => {
  it("normalises Kenyan mobile numbers to the format PayHero expects", () => {
    expect(normalizePhone("0712 345 678")).toBe("0712345678");
    expect(normalizePhone("+254712345678")).toBe("0712345678");
    expect(normalizePhone("254712345678")).toBe("0712345678");
    expect(normalizePhone("712345678")).toBe("0712345678");
    expect(normalizePhone("0112345678")).toBe("0112345678");
    expect(normalizePhone("0812345678")).toBeNull();
    expect(normalizePhone("0712")).toBeNull();
  });

  it("builds a prefilled Lipwa checkout on the account URL", () => {
    const url = new URL(
      buildPayHeroPaymentUrl({
        reference: "SB-ABC-1234",
        amount: 1234.6,
        phone: "0712345678",
        name: "Kevin Mutua",
        origin: "https://pos.samulbikers.co.ke",
      }),
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://lipwa.link/13691");
    expect(url.searchParams.get("amount")).toBe("1235");
    expect(url.searchParams.get("reference")).toBe("SB-ABC-1234");
    expect(url.searchParams.get("phone")).toBe("0712345678");
    expect(url.searchParams.get("name")).toBe("Kevin Mutua");
    expect(url.searchParams.get("channel_id")).toBe("14988");
    expect(url.searchParams.get("success_url")).toBe(
      "https://pos.samulbikers.co.ke/checkout/success?ref=SB-ABC-1234",
    );
    expect(url.searchParams.get("failed_url")).toBe(
      "https://pos.samulbikers.co.ke/checkout/failed?ref=SB-ABC-1234",
    );
  });

  it("creates a unique PayHero reference", () => {
    const first = createPaymentReference();
    const second = createPaymentReference();
    expect(first).toMatch(/^SB-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(second).not.toBe(first);
  });

  it("reads success and failure redirects from our checkout pages only", () => {
    expect(paymentResultFromUrl("https://shop.test/checkout/success?ref=SB-1", "https://shop.test")).toEqual({
      success: true,
      reference: "SB-1",
    });
    expect(paymentResultFromUrl("https://shop.test/checkout/failed?ref=SB-2", "https://shop.test")).toEqual({
      success: false,
      reference: "SB-2",
    });
    expect(paymentResultFromUrl("https://lipwa.link/13691", "https://shop.test")).toBeNull();
  });
});
