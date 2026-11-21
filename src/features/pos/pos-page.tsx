import {
  Banknote,
  Barcode,
  Check,
  CreditCard,
  Download,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  ScanLine,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, QueryError, QueryLoading, SupabaseNotice } from "@/components/data/query-state";
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
import { useCustomers, useProducts, useSiteSettings, type CatalogProduct } from "@/lib/supabase/queries";
import { useCompleteSale } from "@/lib/supabase/mutations";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/branches/branch-store";
import { playScanBeep } from "@/lib/pos/beep";
import {
  buildReceipt,
  downloadReceiptPdf,
  printReceipt,
  type ReceiptData,
} from "@/lib/receipts/receipt";
import { ReceiptDocument } from "@/features/sales/receipt-document";
import { formatKes } from "@/lib/format";

const VAT_RATE = 0.16;
type PaymentMethod = "M-Pesa" | "Cash" | "Card";

type CartLine = { product: CatalogProduct; quantity: number };

const paymentOptions: { method: PaymentMethod; icon: typeof Banknote; hint: string }[] = [
  { method: "M-Pesa", icon: Smartphone, hint: "Till / paybill" },
  { method: "Cash", icon: Banknote, hint: "Counter cash" },
  { method: "Card", icon: CreditCard, hint: "PDQ terminal" },
];

function ProductImage({ product, className }: { product: CatalogProduct; className: string }) {
  if (product.image) {
    return <img src={product.image} alt={product.title} className={`${className} object-cover`} loading="lazy" />;
  }

  return (
    <span className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>
      <ShoppingCart aria-hidden="true" className="size-5" />
    </span>
  );
}

export function PosPage() {
  const { user } = useAuth();
  const branches = useBranches();
  const productsQuery = useProducts();
  const customersQuery = useCustomers();
  const settingsQuery = useSiteSettings();
  const completeSale = useCompleteSale();

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("walk-in");
  const [method, setMethod] = useState<PaymentMethod>("M-Pesa");
  const [discount, setDiscount] = useState("0");
  const [scanValue, setScanValue] = useState("");
  const [completed, setCompleted] = useState<{ receiptData: ReceiptData } | null>(null);
  const branchName = branches.find((branch) => branch.id === user?.branchId)?.name ?? "Main branch";

  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const categories = useMemo(() => {
    const names = new Set(products.map((product) => product.categoryName));
    return ["All", ...Array.from(names).sort()];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.categoryName === category;
      const matchesQuery = !needle || `${product.title} ${product.sku}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const taxable = subtotal - discountValue;
  const vat = Math.round(taxable * VAT_RATE);
  const total = taxable + vat;
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const customerLabel =
    customerId === "walk-in"
      ? "Walk-in customer"
      : (customers.find((customer) => customer.id === customerId)?.name ?? "Walk-in customer");

  const addToCart = (product: CatalogProduct) => {
    if (product.stock <= 0) {
      toast.error(`${product.title} is out of stock`);
      return;
    }
    playScanBeep();
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing) return [...current, { product, quantity: 1 }];
      if (existing.quantity >= product.stock) {
        toast.warning(`Only ${product.stock} unit(s) of ${product.title} in stock`);
        return current;
      }
      return current.map((line) =>
        line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
      );
    });
  };

  const handleScan = (event: React.FormEvent) => {
    event.preventDefault();
    const code = scanValue.trim().toLowerCase();
    if (!code) return;

    const product = products.find(
      (entry) =>
        entry.sku.toLowerCase() === code ||
        entry.title.toLowerCase() === code ||
        entry.id.toLowerCase() === code ||
        entry.slug.toLowerCase() === code,
    );
    if (!product) {
      toast.error("Barcode not recognised", { description: `No product matches “${scanValue.trim()}”.` });
      setScanValue("");
      return;
    }
    if (product.stock <= 0) {
      toast.error(`${product.title} is out of stock`);
      setScanValue("");
      return;
    }

    addToCart(product);
    toast.success(`${product.title} added`, { description: `Scanned ${product.sku}` });
    setScanValue("");
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line;
          const next = line.quantity + delta;
          if (next > line.product.stock) {
            toast.warning(`Only ${line.product.stock} unit(s) available`);
            return line;
          }
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const handleComplete = async () => {
    if (!cart.length) {
      toast.error("Add a product before completing the sale.");
      return;
    }

    try {
      const sale = await completeSale.mutateAsync({
        customerId: customerId === "walk-in" ? null : customerId,
        customerName: customerLabel,
        cashier: user?.name ?? "Store manager",
        paymentMethod: method,
        discount: discountValue,
        lines: cart.map((line) => ({
          product_id: line.product.id,
          product_title: line.product.title,
          quantity: line.quantity,
          unit_price: line.product.price,
        })),
      });

      const receiptData = buildReceipt({
        receipt: sale.receipt,
        createdAt: sale.created_at ?? new Date().toISOString(),
        cashier: user?.name ?? "Store manager",
        cashierId: user?.username,
        customer: customerLabel,
        lines: cart.map((line) => ({
          title: line.product.title,
          quantity: line.quantity,
          unitPrice: line.product.price,
          lineTotal: line.product.price * line.quantity,
        })),
        subtotal: Number(sale.subtotal ?? subtotal),
        discount: Number(sale.discount ?? discountValue),
        vat: Number(sale.vat ?? vat),
        total: Number(sale.total ?? total),
        paymentMethod: method,
        status: sale.status,
        settings: settingsQuery.data,
        branch: branchName,
      });

      setCompleted({ receiptData });
      setCart([]);
      setDiscount("0");
      toast.success(`Sale ${sale.receipt} recorded`, { description: `${formatKes(Number(sale.total))} · ${method}` });
    } catch (error) {
      toast.error("Could not record the sale", {
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

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
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} · {customer.tier}
            </option>
          ))}
        </select>
      </div>

      <div className="dashboard-table-scroller min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {cart.length ? (
          <ul className="space-y-3">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-2.5">
                <ProductImage product={product} className="size-11 shrink-0 rounded-md border border-border" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[11px] font-medium text-card-foreground">{product.title}</p>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product.id, -quantity)}
                      aria-label={`Remove ${product.title} from cart`}
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
                        aria-label={`Reduce quantity of ${product.title}`}
                        className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-7 text-center text-[11px] font-semibold text-card-foreground">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(product.id, 1)}
                        aria-label={`Increase quantity of ${product.title}`}
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
            <p className="text-[10px] text-muted-foreground">Tap a product to start a sale.</p>
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
          onClick={handleComplete}
          disabled={!cart.length || completeSale.isPending}
          className="mt-3 h-10 w-full gap-2 text-[12px] font-semibold"
        >
          <Check aria-hidden="true" className="size-4" />
          {completeSale.isPending ? "Recording sale..." : `Complete sale · ${formatKes(total)}`}
        </Button>
        <p className="mt-2 text-center text-[9px] text-muted-foreground">
          Records to Supabase · stock is updated automatically
        </p>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Point of sale"
        description="Ring up a sale, take payment and issue a receipt. Sales are saved to the shop database."
        meta={
          <>
            {productsQuery.isSuccess && (
              <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
                <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
                Live catalogue · {products.length} products
              </span>
            )}
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-foreground">
              Till 01 · {user?.name ?? "Store manager"} · {branchName}
            </span>
          </>
        }
        actions={
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
        }
      />

      <SupabaseNotice />
      {productsQuery.isError && <QueryError error={productsQuery.error} label="Could not load the catalogue" />}
      {customersQuery.isError && <QueryError error={customersQuery.error} label="Could not load customers" />}

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section
          aria-label="Product catalogue"
          className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-ring">
              <ScanLine aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Search catalogue</span>
              <input
                aria-label="Search catalogue"
                placeholder="Search product or SKU..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full w-full min-w-0 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <span className="text-[10px] text-muted-foreground">{visibleProducts.length} products</span>
          </div>

          <form
            onSubmit={handleScan}
            className="mt-2 flex items-center gap-2 rounded-md border border-amber/40 bg-amber/5 p-1.5"
          >
            <Barcode aria-hidden="true" className="ml-1 size-4 shrink-0 text-amber" />
            <label className="sr-only" htmlFor="pos-scan">
              Scan barcode or SKU
            </label>
            <input
              id="pos-scan"
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              placeholder="Scan barcode / SKU, then press Enter"
              autoComplete="off"
              className="h-7 min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-[10px]">
              Add
            </Button>
          </form>

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

          {productsQuery.isLoading ? (
            <div className="mt-4">
              <QueryLoading label="Loading the live catalogue..." />
            </div>
          ) : !products.length ? (
            <div className="mt-4">
              <EmptyState
                title="No products in the database yet"
                description="Add products in the shop website admin, then reload this page to sell them here."
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const inCart = cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
                const low = product.stock <= product.reorderLevel;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    aria-label={`Add ${product.title} to cart`}
                    className="group relative overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-amber/60 hover:bg-amber/[0.04]"
                  >
                    <ProductImage product={product} className="h-24 w-full" />
                    {inCart > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-amber text-[10px] font-semibold text-background">
                        {inCart}
                      </span>
                    )}
                    <span className="block p-2.5">
                      <span className="line-clamp-2 block min-h-[26px] text-[11px] font-medium leading-[1.3] text-card-foreground">
                        {product.title}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-card-foreground">
                          {formatKes(product.price)}
                        </span>
                        <span className={`text-[9px] font-medium ${product.stock === 0 ? "text-destructive" : low ? "text-amber" : "text-muted-foreground"}`}>
                          {product.stock} left
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
              {!visibleProducts.length && (
                <p className="col-span-full rounded-md border border-dashed border-border px-4 py-8 text-center text-[11px] text-muted-foreground">
                  No products match this search.
                </p>
              )}
            </div>
          )}
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
              <SheetDescription className="text-[10px]">{customerLabel}</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col">{cartPanel("mobile")}</div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={Boolean(completed)} onOpenChange={(open) => !open && setCompleted(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[420px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Official receipt</DialogTitle>
            <DialogDescription className="text-[11px]">
              Saved to Supabase · print or download as PDF.
            </DialogDescription>
          </DialogHeader>
          {completed && <ReceiptDocument data={completed.receiptData} />}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setCompleted(null)} className="h-9">
              Close
            </Button>
            {completed && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => printReceipt(completed.receiptData)}
                  className="h-9 gap-1.5"
                >
                  <Printer aria-hidden="true" className="size-3.5" />
                  Print
                </Button>
                <Button
                  type="button"
                  onClick={() => downloadReceiptPdf(completed.receiptData)}
                  className="h-9 gap-1.5"
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  PDF
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
