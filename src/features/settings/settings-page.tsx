import { Bell, CreditCard, Info, Moon, Palette, ReceiptText, Save, Store, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { QueryError, QueryLoading } from "@/components/data/query-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { useSiteSettings } from "@/lib/supabase/queries";

const LOCAL_KEY = "samul-pos-preferences";

type LocalPreferences = {
  receiptPrefix: string;
  vatRate: string;
  receiptFooter: string;
  showVat: boolean;
  autoPrint: boolean;
  mpesa: boolean;
  cash: boolean;
  card: boolean;
  lowStock: boolean;
  dailySummary: boolean;
  largeSale: boolean;
};

const defaultPreferences: LocalPreferences = {
  receiptPrefix: "SBH-",
  vatRate: "16",
  receiptFooter: "Asante sana · Ride safe",
  showVat: true,
  autoPrint: true,
  mpesa: true,
  cash: true,
  card: false,
  lowStock: true,
  dailySummary: true,
  largeSale: false,
};

function useLocalPreferences() {
  const [preferences, setPreferences] = useState<LocalPreferences>(defaultPreferences);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_KEY);
      if (stored) setPreferences({ ...defaultPreferences, ...(JSON.parse(stored) as Partial<LocalPreferences>) });
    } catch {
      // Ignore malformed local preferences and keep defaults.
    }
  }, []);

  const update = (patch: Partial<LocalPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { preferences, update };
}

function ReadOnlyField({ id, label, value, hint }: { id: string; label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] font-medium text-foreground">
        {label}
      </Label>
      <Input id={id} value={value} readOnly className="h-9 bg-muted/40 text-[11px]" />
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
  const settingsQuery = useSiteSettings();
  const { preferences, update } = useLocalPreferences();
  const settings = settingsQuery.data;

  const saveLocally = (section: string) =>
    toast.success(`${section} saved on this device`, {
      description: "Business details themselves are managed on the shop website.",
    });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details come from the shop database; till preferences stay on this device."
        meta={
          settingsQuery.isSuccess ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald/30 bg-emerald-subtle px-2 text-[10px] font-medium text-emerald">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />
              Business profile synced
            </span>
          ) : null
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
            Receipt & tax
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
            <p className="mt-1 text-[11px] text-muted-foreground">
              Pulled live from <span className="font-mono text-[10px]">site_settings</span> and shown on receipts.
            </p>

            {settingsQuery.isLoading ? (
              <div className="mt-4">
                <QueryLoading label="Loading business profile..." />
              </div>
            ) : settingsQuery.isError ? (
              <div className="mt-4">
                <QueryError error={settingsQuery.error} label="Could not load the business profile" />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadOnlyField id="business-name" label="Business name" value={settings?.business_name ?? "—"} />
                <ReadOnlyField id="business-tagline" label="Tagline" value={settings?.tagline ?? "—"} />
                <ReadOnlyField id="business-phone" label="Telephone" value={settings?.phone ?? "—"} />
                <ReadOnlyField id="business-whatsapp" label="WhatsApp" value={settings?.whatsapp ?? "—"} />
                <ReadOnlyField id="business-email" label="Email" value={settings?.email ?? "—"} />
                <ReadOnlyField id="business-city" label="City / County" value={settings ? `${settings.city}, ${settings.county}` : "—"} />
                <div className="sm:col-span-2">
                  <ReadOnlyField
                    id="business-address"
                    label="Address"
                    value={settings ? [settings.address_line1, settings.address_line2].filter(Boolean).join(" · ") : "—"}
                    hint="Edit these details in the shop website admin — they sync here automatically."
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-[10px] text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              Business profile fields are read-only in the POS to keep the website and till in sync.
            </div>
          </section>
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Receipt & tax</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Numbering and VAT presentation for printed receipts.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="receipt-prefix" className="text-[11px]">
                  Receipt prefix
                </Label>
                <Input
                  id="receipt-prefix"
                  value={preferences.receiptPrefix}
                  onChange={(event) => update({ receiptPrefix: event.target.value })}
                  className="h-9 text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">Receipts are assigned sequentially in the database.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="receipt-vat" className="text-[11px]">
                  VAT rate (%)
                </Label>
                <Input
                  id="receipt-vat"
                  value={preferences.vatRate}
                  onChange={(event) => update({ vatRate: event.target.value.replace(/[^0-9.]/g, "") })}
                  className="h-9 text-[11px]"
                />
                <p className="text-[10px] text-muted-foreground">The POS currently records VAT at 16%.</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="receipt-footer" className="text-[11px]">
                  Receipt footer
                </Label>
                <Input
                  id="receipt-footer"
                  value={preferences.receiptFooter}
                  onChange={(event) => update({ receiptFooter: event.target.value })}
                  className="h-9 text-[11px]"
                />
              </div>
            </div>
            <div className="mt-3">
              <ToggleRow
                id="receipt-show-vat"
                label="Show VAT breakdown"
                description="Print the net amount and VAT on every receipt."
                checked={preferences.showVat}
                onCheckedChange={(checked) => update({ showVat: checked })}
              />
              <ToggleRow
                id="receipt-auto-print"
                label="Auto-print receipts"
                description="Send the receipt to the till printer as soon as a sale completes."
                checked={preferences.autoPrint}
                onCheckedChange={(checked) => update({ autoPrint: checked })}
              />
            </div>
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Button type="button" size="sm" className="h-9 gap-1.5" onClick={() => saveLocally("Receipt settings")}>
                <Save aria-hidden="true" className="size-3.5" />
                Save receipt rules
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Payment methods</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Enable the ways customers can settle a sale at this till.</p>
            <div className="mt-3">
              <ToggleRow
                id="pay-mpesa"
                label="M-Pesa"
                description="Paybill or till number collection at the counter."
                checked={preferences.mpesa}
                onCheckedChange={(checked) => update({ mpesa: checked })}
              />
              <ToggleRow
                id="pay-cash"
                label="Cash"
                description="Counter cash with an open drawer reconciliation."
                checked={preferences.cash}
                onCheckedChange={(checked) => update({ cash: checked })}
              />
              <ToggleRow
                id="pay-card"
                label="Card / bank"
                description="PDQ terminal and bank transfers for trade accounts."
                checked={preferences.card}
                onCheckedChange={(checked) => update({ card: checked })}
              />
            </div>
            <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-3 text-[10px] text-muted-foreground">
              Payment capture happens at the till — card and M-Pesa settlement are not automated in this build.
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Notifications</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Choose which alerts the workspace surfaces.</p>
            <div className="mt-3">
              <ToggleRow
                id="notify-low-stock"
                label="Low stock alerts"
                description="Flag products at or below their reorder level."
                checked={preferences.lowStock}
                onCheckedChange={(checked) => update({ lowStock: checked })}
              />
              <ToggleRow
                id="notify-daily"
                label="Daily sales summary"
                description="A digest of takings, refunds and top sellers."
                checked={preferences.dailySummary}
                onCheckedChange={(checked) => update({ dailySummary: checked })}
              />
              <ToggleRow
                id="notify-large"
                label="Large sale alerts"
                description="Notify managers for sales above KES 50,000."
                checked={preferences.largeSale}
                onCheckedChange={(checked) => update({ largeSale: checked })}
              />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
            <h3 className="text-[14px] font-semibold text-card-foreground">Appearance</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">The theme is remembered on this device.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: "light" as const, label: "Light", description: "Bright counter-friendly workspace.", icon: Sun },
                { value: "dark" as const, label: "Dark", description: "Lower glare for evening shifts.", icon: Moon },
              ].map((option) => {
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
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                        active ? "bg-amber/15 text-amber" : "bg-muted text-muted-foreground"
                      }`}
                    >
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
