export type PayHeroPayment = {
  paymentSuccess: boolean;
  reference?: string;
  user_reference?: string;
  provider?: string;
  providerReference?: string;
  amount?: number;
  phone?: string;
  customerName?: string;
  channel?: string;
};

const env = import.meta.env as Record<string, string | undefined>;

/**
 * PayHero Lipwa config. The defaults below are the shop account values; they can
 * be overridden with VITE_PAYHERO_PAYMENT_URL and VITE_PAYHERO_CHANNEL_ID.
 */
export const payHeroConfig = {
  paymentUrl: env["VITE_PAYHERO_PAYMENT_URL"] || "https://lipwa.link/13691/p/22lU7iHz",
  channelId: Number(env["VITE_PAYHERO_CHANNEL_ID"] || 14988),
};

export const isPayHeroConfigured = () =>
  Boolean(payHeroConfig.paymentUrl) && Number.isFinite(payHeroConfig.channelId);

export function payHeroCheckoutOrigin() {
  if (typeof window === "undefined") return "http://localhost:8081";
  return window.location.origin;
}

/**
 * Lipwa only reads prefill params on the account link. The shareable
 * `/p/<id>` page drops the query string on redirect, so strip it.
 */
function paymentBaseUrl() {
  const url = new URL(payHeroConfig.paymentUrl);
  url.pathname = url.pathname.replace(/\/p\/[^/]+\/?$/, "");
  url.search = "";
  url.hash = "";
  return url;
}

export function buildPayHeroPaymentUrl(options: {
  reference: string;
  amount: number;
  phone: string;
  name: string;
  origin?: string;
}) {
  const url = paymentBaseUrl();
  const origin = options.origin ?? payHeroCheckoutOrigin();

  url.searchParams.set("amount", String(Math.round(options.amount)));
  url.searchParams.set("reference", options.reference);
  url.searchParams.set("phone", options.phone);
  url.searchParams.set("name", options.name);
  url.searchParams.set("channel_id", String(payHeroConfig.channelId));
  url.searchParams.set(
    "success_url",
    `${origin}/checkout/success?ref=${encodeURIComponent(options.reference)}`,
  );
  url.searchParams.set(
    "failed_url",
    `${origin}/checkout/failed?ref=${encodeURIComponent(options.reference)}`,
  );

  return url.toString();
}

/**
 * Normalises Kenyan mobile numbers to the `07XXXXXXXX` form PayHero expects.
 * Accepts `0712 345 678`, `+254712345678`, `254712345678` and `712345678`.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.startsWith("254")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (local.length !== 9 || !/^[17]\d{8}$/.test(local)) return null;
  return `0${local}`;
}

export function formatPhoneDisplay(phone: string) {
  return phone.length === 10 ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone;
}

/** Short checkout reference, e.g. `SB-1K8QZ4-7F3D`. */
export function createPaymentReference() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SB-${time}-${random}`;
}

/** Reads PayHero's success/failed redirect once the popup lands back on our origin. */
export function paymentResultFromUrl(href: string, origin: string) {
  try {
    const url = new URL(href);
    if (url.origin !== origin) return null;
    if (url.pathname === "/checkout/success") {
      return { success: true as const, reference: url.searchParams.get("ref") ?? undefined };
    }
    if (url.pathname === "/checkout/failed") {
      return { success: false as const, reference: url.searchParams.get("ref") ?? undefined };
    }
    return null;
  } catch {
    return null;
  }
}
