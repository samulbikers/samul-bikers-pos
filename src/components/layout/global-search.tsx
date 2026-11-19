import { useNavigate } from "@tanstack/react-router";
import { Boxes, ContactRound, ReceiptText, Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { navigationGroups } from "@/components/layout/nav";
import { useCustomers, useProducts, useSales } from "@/lib/supabase/queries";
import { formatKes } from "@/lib/format";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const productsQuery = useProducts();
  const salesQuery = useSales(25);
  const customersQuery = useCustomers();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    void navigate({ to });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products, receipts, or customers"
        className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-[11px] text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground lg:flex"
      >
        <Search aria-hidden="true" className="size-[15px] shrink-0" />
        <span className="w-[150px] truncate xl:w-[190px]">Search anything...</span>
        <kbd className="rounded border border-border px-1 font-sans text-[9px]">⌘K</kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Samul Bikers POS"
        description="Find pages, products, sales and customers"
      >
        <CommandInput placeholder="Search products, receipts, pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navigationGroups.flatMap((group) =>
              group.items.map((item) => (
                <CommandItem key={item.to} value={`page ${item.label}`} onSelect={() => go(item.to)}>
                  <item.icon aria-hidden="true" className="mr-2 size-4" />
                  {item.label}
                  <CommandShortcut>{group.label}</CommandShortcut>
                </CommandItem>
              )),
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Products">
            {(productsQuery.data ?? []).slice(0, 6).map((product) => (
              <CommandItem
                key={product.id}
                value={`product ${product.title} ${product.sku}`}
                onSelect={() => go("/products")}
              >
                <ShoppingBag aria-hidden="true" className="mr-2 size-4" />
                <span className="truncate">{product.title}</span>
                <CommandShortcut>{product.sku}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Sales">
            {(salesQuery.data ?? []).slice(0, 5).map((sale) => (
              <CommandItem
                key={sale.id}
                value={`sale ${sale.receipt} ${sale.customer_name}`}
                onSelect={() => go("/sales")}
              >
                <ReceiptText aria-hidden="true" className="mr-2 size-4" />
                {sale.receipt} · {sale.customer_name}
                <CommandShortcut>{formatKes(Number(sale.total))}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Customers">
            {(customersQuery.data ?? []).slice(0, 5).map((customer) => (
              <CommandItem
                key={customer.id}
                value={`customer ${customer.name} ${customer.phone ?? ""}`}
                onSelect={() => go("/customers")}
              >
                <ContactRound aria-hidden="true" className="mr-2 size-4" />
                {customer.name}
                <CommandShortcut>{customer.location ?? customer.tier}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Inventory">
            <CommandItem value="inventory stock alerts" onSelect={() => go("/inventory")}>
              <Boxes aria-hidden="true" className="mr-2 size-4" />
              Low stock alerts
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
