import {
  Banknote,
  Check,
  CreditCard,
  Minus,
  Plus,
  ReceiptText,
  ScanLine,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PreviewBadge } from "@/components/data/preview-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sampleCategories, sampleProducts, type Product } from "@/data/sample/catalog";
import { categoryImages, categoryAltText, type ProductCategory } from "@/data/sample/images";
import { sampleCustomers } from "@/data/sample/people";
import type { PaymentMethod } from "@/data/sample/operations";
import { formatKes } from "@/lib/format";

const VAT_RATE = 0.16;
const categories: Array<ProductCategory | "All"> = ["All", ...sampleCategories.map((item) => item.name)];

type CartLine = { productId: string; quantity: number };

const paymentOptions: { method: PaymentMethod; icon: typeof Banknote; hint: string }[] = [
  { method: "M-Pesa", icon: Smartphone, hint: "Till 884210" },
  { method: "Cash", icon: Banknote, hint: "Counter cash" },
  { method: "Card", icon: CreditCard, hint: "PDQ terminal" },
];

function nextReceiptNumber() {
  return `SBH-${String(2482 + Math.floor(Math.random() * 40)).padStart(5, "0")}`;
}

export function PosPage() {
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("walk-in");
  const [method, setMethod] = useState<PaymentMethod>("M-Pesa");
  const [discount, setDiscount] = useState("0");
  const [completed, setCompleted] = useState<{ receipt: string; total: number; method: PaymentMethod } | null>(null);

  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sampleProducts.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = !needle || `${product.name} ${product.sku}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const lines = cart.flatMap((line) => {
    const product = sampleProducts.find((item) => item.id === line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  });

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const taxable = subtotal - discountValue;
  const vat = Math.round(taxable * VAT_RATE);
  const total = taxable + vat;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const completeSale = () => {
    if (!lines.length) {
      toast.error("Add a product before completing the sale.");
      return;
    }
    const receipt = nextReceiptNumber();
    setCompleted({ receipt, total, method });
    toast.success(`Sale ${receipt} recorded`, {
      description: `${formatKes(total)} · ${method} · preview only`,
    });
    setCart([]);
    setDiscount("0");
  };

  const customerLabel =
    customerId === "walk-in"
      ? "Walk-in customer"
      : (sampleCustomers.find((customer) => customer.id === customerId)?.name ?? "Walk-in customer");

  const cartPanel = (suffix: string) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <label className="block text-[10px] font-medium text-muted-foreground" htmlFor={`pos-customer-${suffix}`}>
          CUSTOMER
        </label>
        <select
          id={`pos-customer-${suffix}`}
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          className="mt-1 h-9 w-full cursor-pointer rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="walk-in">Walk-in customer</option>
          {sampleCustomers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} · {customer.tier}
            </option>
          ))}
        </select>
      </div>

      <div className="dashboard-table-scroller min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {lines.length ? (
          <ul className="space-y-3">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-2.5">
                <img
                  src={categoryImages[product.category]}
                  alt={categoryAltText[product.category]}
                  className="size-11 shrink-0 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[11px] font-medium text-card-foreground">{product.name}</p>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product.id, -quantity)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatKes(product.price)} · {product.sku}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex h-7 items-center rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, -1)}
                        aria-label={`Reduce quantity of ${product.name}`}
                        className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-7 text-center text-[11px] font-semibold text-card-foreground">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, 1)}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <span className="text-[11px] font-semibold text-card-foreground">
                      {formatKes(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center">
            <ShoppingCart aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className="text-[11px] font-medium text-card-foreground">Cart is empty</p>
            <p className="text-[10px] text-muted-foreground">Tap a product to start a sample sale.</p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-medium text-card-foreground">{formatKes(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <label htmlFor={`pos-discount-${suffix}`}>Discount</label>
            <div className="flex h-7 w-24 items-center gap-1 rounded-md border border-border px-2">
              <span className="text-[10px] text-muted-foreground">KES</span>
              <input
                id={`pos-discount-${suffix}`}
                inputMode="numeric"
                value={discount}
                onChange={(event) => setDiscount(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full bg-transparent text-right text-[11px] text-card-foreground outline-none"
              />
            </div>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT (16%)</span>
            <span className="font-medium text-card-foreground">{formatKes(vat)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-[11px] font-medium text-muted-foreground">Total due</span>
          <span className="font-display text-[20px] font-semibold text-foreground">{formatKes(total)}</span>
        </div>

        <fieldset className="mt-3">
          <legend className="text-[10px] font-medium text-muted-foreground">PAYMENT METHOD</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {paymentOptions.map((option) => {
              const active = method === option.method;
              return (
                <button
                  key={option.method}
                  type="button"
                  onClick={() => setMethod(option.method)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10px] font-medium transition-colors ${
                    active
                      ? "border-amber/50 bg-amber/10 text-amber"
                      : "border-border text-muted-foreground hover:border-ring/60 hover:text-foreground"
                  }`}
                >
                  <option.icon aria-hidden="true" className="size-3.5" />
                  {option.method}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button
          type="button"
          onClick={completeSale}
          disabled={!lines.length}
          className="mt-3 h-10 w-full gap-2 text-[12px] font-semibold"
        >
          <Check aria-hidden="true" className="size-4" />
          Complete sale · {formatKes(total)}
        </Button>
        <p className="mt-2 text-center text-[9px] text-muted-foreground">
          Preview only · No payment is captured
        </p>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Point of sale"
        description="Ring up a sample sale, take payment and issue a preview receipt."
        meta={
          <>
            <PreviewBadge />
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-foreground">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Till 01 · Lucy Achieng
            </span>
            <span className="text-[10px] text-muted-foreground">Shift open · 08:00</span>
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                setCart([]);
                setDiscount("0");
                toast.info("New sale started");
              }}
            >
              <ScanLine aria-hidden="true" className="size-3.5" />
              New sale
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              disabled={!lines.length}
              onClick={() => toast.success("Sample sale held", { description: `${itemCount} item(s) parked for later.` })}
            >
              <ReceiptText aria-hidden="true" className="size-3.5" />
              Hold sale
            </Button>
          </>
        }
      />

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Product catalogue" className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-ring">
              <ScanLine aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Search catalogue</span>
              <input
                aria-label="Search catalogue"
                placeholder="Scan barcode or search products..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full w-full min-w-0 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <span className="text-[10px] text-muted-foreground">{products.length} products</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((item) => {
              const active = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={active}
                  className={`h-7 rounded-full border px-3 text-[10px] font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-ring/60 hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => {
              const inCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
              const low = product.stock <= product.reorderLevel;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  aria-label={`Add ${product.name} to cart`}
                  className="group relative overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-amber/60 hover:bg-amber/[0.04]"
                >
                  <img
                    src={categoryImages[product.category]}
                    alt={categoryAltText[product.category]}
                    className="h-24 w-full object-cover"
                  />
                  {inCart > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-amber text-[10px] font-semibold text-background">
                      {inCart}
                    </span>
                  )}
                  <span className="block p-2.5">
                    <span className="line-clamp-2 block min-h-[26px] text-[11px] font-medium leading-[1.3] text-card-foreground">
                      {product.name}
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-card-foreground">
                        {formatKes(product.price)}
                      </span>
                      <span className={`text-[9px] font-medium ${low ? "text-amber" : "text-muted-foreground"}`}>
                        {product.stock} left
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
            {!products.length && (
              <p className="col-span-full rounded-md border border-dashed border-border px-4 py-8 text-center text-[11px] text-muted-foreground">
                No products match this search.
              </p>
            )}
          </div>
        </section>

        <aside
          aria-label="Current sale"
          className="hidden min-h-[520px] min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)] xl:sticky xl:top-[88px] xl:flex xl:h-[calc(100vh-112px)] xl:flex-col"
        >
          {cartPanel("desktop")}
        </aside>
      </div>

      <div className="sticky bottom-3 z-10 xl:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" className="h-11 w-full gap-2 shadow-lg">
              <ShoppingCart aria-hidden="true" className="size-4" />
              Cart · {itemCount} item{itemCount === 1 ? "" : "s"} · {formatKes(total)}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex h-[85vh] max-h-[85vh] flex-col gap-0 rounded-t-xl p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle className="text-[14px]">Current sale</SheetTitle>
              <SheetDescription className="text-[10px]">{customerLabel} · preview</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col">{cartPanel("mobile")}</div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={Boolean(completed)} onOpenChange={(open) => !open && setCompleted(null)}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Preview receipt</DialogTitle>
            <DialogDescription className="text-[11px]">
              Sample receipt · no payment was captured.
            </DialogDescription>
          </DialogHeader>
          {completed && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 font-mono text-[11px]">
              <p className="text-center text-[12px] font-semibold">SAMUL BIKERS HAVEN</p>
              <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
                Kirinyaga Road, Nairobi · +254 720 000 114
              </p>
              <div className="my-3 border-t border-dashed border-border" />
              <p className="flex justify-between">
                <span className="text-muted-foreground">Receipt</span>
                <span>{completed.receipt}</span>
              </p>
              <p className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{customerLabel}</span>
              </p>
              <p className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span>{completed.method}</span>
              </p>
              <div className="my-3 border-t border-dashed border-border" />
              <p className="flex justify-between text-[12px] font-semibold">
                <span>Total paid</span>
                <span>{formatKes(completed.total)}</span>
              </p>
              <p className="mt-3 text-center text-[9px] text-muted-foreground">
                Asante sana · Ride safe
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setCompleted(null)} className="h-9">
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                toast.info("Printing is disabled in the preview workspace.");
              }}
              className="h-9 gap-1.5"
            >
              Print receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
