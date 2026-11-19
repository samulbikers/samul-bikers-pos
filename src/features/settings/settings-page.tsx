import { Bell, CreditCard, Moon, Palette, ReceiptText, Save, Store, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PreviewBadge } from "@/components/data/preview-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 text-[11px]"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[11px] font-medium text-foreground">
          {label}
        </Label>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [business, setBusiness] = useState({
    name: "Samul Bikers Haven",
    phone: "+254 720 000 114",
    email: "hello@samulbikers.co.ke",
    address: "Kirinyaga Road, Stall 14, Nairobi",
    currency: "KES · Kenyan Shilling",
    timezone: "Africa/Nairobi (EAT)",
  });
  const [receipt, setReceipt] = useState({ prefix: "SBH-", vat: "16", footer: "Asante sana · Ride safe" });
  const [showVat, setShowVat] = useState(true);
  const [autoPrint, setAutoPrint] = useState(true);
  const [mpesa, setMpesa] = useState(true);
  const [cash, setCash] = useState(true);
  const [card, setCard] = useState(false);
  const [lowStock, setLowStock] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [largeSale, setLargeSale] = useState(false);

  const save = (section: string) =>
    toast.success(`${section} saved`, { description: "Preview only — nothing is persisted to a server." });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, receipt rules and how the workspace looks."
        meta={<PreviewBadge />}
        actions={
          <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => save("Settings")}>
            <Save aria-hidden="true" className="size-3.5" />
            Save changes
          </Button>
        }
      />

      <Tabs defaultValue="business" className="min-w-0">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-border bg-card p-1">
          <TabsTrigger value="business" className="h-8 gap-1.5 px-3 text-[11px]">
            <Store aria-hidden="true" className="size-3.5" />
            Business profile
          </TabsTrigger>
          <TabsTrigger value="receipts" className="h-8 gap-1.5 px-3 text-[11px]">
            <ReceiptText aria-hidden="true" className="size-3.5" />
            Receipts & tax
          </TabsTrigger>
          <TabsTrigger value="payments" className="h-8 gap-1.5 px-3 text-[11px]">
            <CreditCard aria-hidden="true" className="size-3.5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="h-8 gap-1.5 px-3 text-[11px]">
            <Bell aria-hidden="true" className="size-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="h-8 gap-1.5 px-3 text-[11px]">
            <Palette aria-hidden="true" className="size-3.5" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Business profile</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Appears on receipts and reports.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="business-name" label="Business name" value={business.name} onChange={(value) => setBusiness({ ...business, name: value })} />
              <Field id="business-phone" label="Telephone / till" value={business.phone} onChange={(value) => setBusiness({ ...business, phone: value })} />
              <Field id="business-email" label="Email" type="email" value={business.email} onChange={(value) => setBusiness({ ...business, email: value })} />
              <Field id="business-address" label="Address" value={business.address} onChange={(value) => setBusiness({ ...business, address: value })} />
              <Field id="business-currency" label="Currency" value={business.currency} onChange={(value) => setBusiness({ ...business, currency: value })} hint="Prices are displayed in Kenyan Shillings." />
              <Field id="business-timezone" label="Timezone" value={business.timezone} onChange={(value) => setBusiness({ ...business, timezone: value })} />
            </div>
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => save("Business profile")}>
                <Save aria-hidden="true" className="size-3.5" />
                Save profile
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Receipts & tax</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Numbering and VAT presentation on printed receipts.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="receipt-prefix" label="Receipt prefix" value={receipt.prefix} onChange={(value) => setReceipt({ ...receipt, prefix: value })} hint="Next receipt: SBH-02482" />
              <Field id="receipt-vat" label="VAT rate (%)" value={receipt.vat} onChange={(value) => setReceipt({ ...receipt, vat: value.replace(/[^0-9.]/g, "") })} />
              <div className="sm:col-span-2">
                <Field id="receipt-footer" label="Receipt footer" value={receipt.footer} onChange={(value) => setReceipt({ ...receipt, footer: value })} />
              </div>
            </div>
            <div className="mt-3">
              <ToggleRow id="receipt-show-vat" label="Show VAT breakdown" description="Print the net amount and VAT on every receipt." checked={showVat} onCheckedChange={setShowVat} />
              <ToggleRow id="receipt-auto-print" label="Auto-print receipts" description="Send the receipt to the till printer as soon as a sale completes." checked={autoPrint} onCheckedChange={setAutoPrint} />
            </div>
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => save("Receipt settings")}>
                <Save aria-hidden="true" className="size-3.5" />
                Save receipt rules
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Payment methods</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Enable the ways customers can settle a sale.</p>
            <div className="mt-3">
              <ToggleRow id="pay-mpesa" label="M-Pesa" description="Paybill or till number collection at the counter." checked={mpesa} onCheckedChange={setMpesa} />
              <ToggleRow id="pay-cash" label="Cash" description="Counter cash with an open drawer reconciliation." checked={cash} onCheckedChange={setCash} />
              <ToggleRow id="pay-card" label="Card / bank" description="PDQ terminal and bank transfers for trade accounts." checked={card} onCheckedChange={setCard} />
            </div>
            <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-3 text-[10px] text-muted-foreground">
              Payments are not captured in this preview. Live payment connectors are configured in the deployed app.
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Notifications</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Choose which alerts the workspace surfaces.</p>
            <div className="mt-3">
              <ToggleRow id="notify-low-stock" label="Low stock alerts" description="Flag products at or below their reorder level." checked={lowStock} onCheckedChange={setLowStock} />
              <ToggleRow id="notify-daily" label="Daily sales summary" description="A digest of takings, refunds and top sellers." checked={dailySummary} onCheckedChange={setDailySummary} />
              <ToggleRow id="notify-large" label="Large sale alerts" description="Notify managers for sales above KES 50,000." checked={largeSale} onCheckedChange={setLargeSale} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Appearance</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">The theme is remembered on this device.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "light" as const, label: "Light", description: "Bright counter-friendly workspace.", icon: Sun },
                  { value: "dark" as const, label: "Dark", description: "Lower glare for evening shifts.", icon: Moon },
                ]
              ).map((option) => {
                const active = theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={active}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      active ? "border-amber/60 bg-amber/10" : "border-border hover:border-ring/60"
                    }`}
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${active ? "bg-amber/15 text-amber" : "bg-muted text-muted-foreground"}`}>
                      <option.icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium text-card-foreground">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
