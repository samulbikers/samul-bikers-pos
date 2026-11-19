import { useEffect, useId, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  CircleDollarSign,
  Command,
  CreditCard,
  FileWarning,
  Gauge,
  Menu,
  MoreHorizontal,
  Package,
  PackageCheck,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatKes, formatNairobiDate } from "@/features/dashboard/dashboard-formatting";
import {
  dateRanges,
  lowStockProducts,
  navigationGroups,
  overviewByRange,
  paymentMethods,
  previewActivities,
  recentTransactions,
  salesByCategory,
  weekDays,
  type DashboardRange,
  type Transaction,
} from "@/features/dashboard/dashboard-data";
import logo from "@/assets/samul-bikers-logo.png";
import safetyImage from "@/assets/cat-safety-gear.jpg";
import storageImage from "@/assets/cat-tailboxes.jpg";

function getNairobiDate() {
  return formatNairobiDate(new Date());
}

function SidebarContents({
  collapsed,
  closeMenu,
}: {
  collapsed: boolean;
  closeMenu?: () => void;
}) {
  const iconsByLabel: Record<string, LucideIcon> = {
    Dashboard: Gauge,
    "Point of sale": ShoppingCart,
    Sales: ReceiptText,
    Products: ShoppingBag,
    Inventory: Boxes,
    Categories: Store,
    Suppliers: Truck,
    Purchases: Package,
    Customers: UsersRound,
    Expenses: CircleDollarSign,
    "Reports & analytics": TrendingUp,
    "Staff & users": UsersRound,
    Branches: Store,
    Settings: Settings2,
  };

  return (
    <>
      <a href="#dashboard" aria-label="Samul Bikers dashboard" onClick={closeMenu} className="flex min-h-[68px] items-center gap-3 border-b border-sidebar-border px-[19px]">
        <img src={logo} alt="Samul Bikers logo" className="size-10 shrink-0 object-contain" />
        {!collapsed && <span className="min-w-0 leading-tight"><span className="block font-display text-sm font-semibold text-sidebar-foreground">SAMUL BIKERS</span><span className="mt-1 block text-[10px] font-medium text-sidebar-muted">BUSINESS MANAGEMENT</span></span>}
      </a>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-5">
        {navigationGroups.map((group) => (
          <section key={group.label} className="mb-5">
            {!collapsed && <h2 className="mb-2 px-3 text-[10px] font-semibold text-sidebar-muted">{group.label.toUpperCase()}</h2>}
            <ul className="space-y-1">
              {group.items.map(({ label, badge }) => {
                const Icon = iconsByLabel[label] ?? Gauge;
                const active = label === "Dashboard";

                return (
                  <li key={label}>
                    <Button
                      type="button"
                      variant="ghost"
                      title={collapsed ? label : undefined}
                      aria-current={active ? "page" : undefined}
                      aria-label={label}
                      onClick={active ? closeMenu : undefined}
                      className={`h-9 w-full justify-start gap-3 rounded-md px-3 text-[13px] font-medium ${active ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                    >
                      <Icon aria-hidden="true" className={`size-4 shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{label}</span>}
                      {!collapsed && badge && <span className="flex size-[21px] items-center justify-center rounded-[5px] bg-amber/15 text-[10px] font-semibold text-amber">{badge}</span>}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary"><ShieldCheck aria-hidden="true" className="size-4" /></span><span className="min-w-0"><span className="block truncate text-[11px] font-medium text-sidebar-foreground">Samul Bikers Haven</span><span className="mt-0.5 block text-[10px] text-sidebar-muted">Nairobi · Kenya</span></span><Check aria-label="Business location" className="ml-auto size-3.5 shrink-0 text-sidebar-primary" /></div>
          <p className="mt-4 border-t border-sidebar-border pt-3 text-[10px] text-sidebar-muted">Business Technology. Simplified.</p>
        </div>
      )}
    </>
  );
}

function SampleDataLabel() {
  return <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-amber/20 bg-amber/10 px-2 text-[10px] font-semibold text-amber"><span aria-hidden="true" className="size-1.5 rounded-full bg-amber" />PREVIEW · SAMPLE DATA</span>;
}

function Metric({
  icon: Icon,
  title,
  value,
  change,
  note,
  color,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  change?: string;
  note: string;
  color: string;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-[18px]">
      <div className="flex items-center justify-between gap-2"><span className="truncate text-[12px] font-medium text-muted-foreground">{title}</span><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted" style={{ color }}><Icon aria-hidden="true" className="size-[15px]" /></span></div>
      <p className="mt-4 truncate font-display text-[23px] font-semibold text-foreground sm:text-[25px]" title={value}>{value}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">{change && <span className="inline-flex items-center gap-0.5 font-semibold text-emerald"><ArrowUpRight aria-hidden="true" className="size-3" />{change}</span>}{note}</p>
    </article>
  );
}

function RevenueChart({ range }: { range: DashboardRange }) {
  const titleId = useId();
  const values = overviewByRange[range].chart;
  const points = values.map((value, index) => `${54 + (index * 672) / Math.max(values.length - 1, 1)},${201 - value * 1.65}`).join(" ");

  return (
    <svg className="dashboard-chart-svg" viewBox="0 0 750 224" preserveAspectRatio="none" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Illustrative revenue over {range.toLowerCase()}</title>
      {[28, 72, 116, 160, 203].map((y) => <line key={y} x1="44" x2="736" y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />)}
      <polygon points={`54,203 ${points} 726,203`} fill="var(--chart-area)" />
      <polyline points={points} fill="none" stroke="var(--chart-line)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={54 + ((values.length - 1) * 672) / Math.max(values.length - 1, 1)} cy={201 - values.at(-1)! * 1.65} r="5.5" fill="var(--chart-line)" stroke="var(--card)" strokeWidth="3" />
    </svg>
  );
}

function SalesOverview({ range }: { range: DashboardRange }) {
  return (
    <section aria-labelledby="sales-chart-title" className="min-w-0 rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-1 pt-4 sm:px-5 sm:pt-5"><div><h2 id="sales-chart-title" className="text-[14px] font-semibold text-card-foreground">Sales overview</h2><p className="mt-1 text-[11px] text-muted-foreground">Revenue movement · {range}</p></div><span className="inline-flex items-center gap-1.5 pt-1 text-[10px] font-medium text-muted-foreground"><span aria-hidden="true" className="size-2 rounded-full bg-emerald" />Preview revenue</span></div>
      <div className="px-2 pb-4 pt-3 sm:px-4 sm:pb-5"><div className="flex h-[162px] items-stretch gap-2 sm:h-[205px]"><div aria-hidden="true" className="flex w-12 shrink-0 flex-col justify-between pb-1 text-right text-[9px] text-muted-foreground"><span>KES 400k</span><span>KES 300k</span><span>KES 200k</span><span>KES 100k</span><span>0</span></div><div className="min-w-0 flex-1"><RevenueChart range={range} /></div></div><div aria-hidden="true" className="ml-[54px] mt-2 flex justify-between text-[9px] text-muted-foreground sm:text-[10px]">{weekDays.map((day) => <span key={day}>{day}</span>)}</div></div>
    </section>
  );
}

function CategoryOverview() {
  return (
    <section aria-labelledby="category-title" className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5">
      <div className="flex items-start justify-between gap-2"><div><h2 id="category-title" className="text-[14px] font-semibold text-card-foreground">Sales by category</h2><p className="mt-1 text-[11px] text-muted-foreground">Preview product mix</p></div><Button type="button" variant="ghost" size="icon" title="Category report options" aria-label="Category report options" className="-mr-1 -mt-1 size-8 text-muted-foreground"><MoreHorizontal /></Button></div>
      <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Sample sales split by product category">{salesByCategory.map((category) => <span key={category.name} style={{ width: `${category.percent}%`, backgroundColor: category.color }} title={`${category.name}: ${category.percent}%`} />)}</div>
      <ul className="mt-4 space-y-[15px]">{salesByCategory.map((category) => <li key={category.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="size-[9px] shrink-0 rounded-sm" style={{ backgroundColor: category.color }} /><span className="truncate text-[11px] text-muted-foreground">{category.name}</span></span><span className="shrink-0 text-right"><span className="block text-[11px] font-medium text-card-foreground">{formatKes(category.amount)}</span><span className="text-[10px] text-muted-foreground">{category.percent}%</span></span></li>)}</ul>
    </section>
  );
}

function TransactionsPanel({ searchQuery }: { searchQuery: string }) {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = query ? recentTransactions.filter((item) => `${item.receipt} ${item.customer} ${item.method}`.toLowerCase().includes(query)) : recentTransactions;
    return showAll ? matches : matches.slice(0, 4);
  }, [searchQuery, showAll]);

  return (
    <section aria-labelledby="transactions-title" className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5"><div><h2 id="transactions-title" className="text-[14px] font-semibold text-card-foreground">Recent transactions</h2><p className="mt-1 text-[11px] text-muted-foreground">Latest activity in this sample view</p></div><Button type="button" variant="ghost" onClick={() => setShowAll((current) => !current)} className="h-8 shrink-0 gap-1.5 px-2 text-[11px] font-medium text-primary">{showAll ? "Show less" : "View all"}<ArrowRight aria-hidden="true" className="size-3.5" /></Button></div>
      <div className="dashboard-table-scroller overflow-x-auto"><table className="w-full min-w-[530px] border-collapse text-left"><thead><tr className="border-y border-border bg-muted/50 text-[10px] font-medium text-muted-foreground"><th className="px-5 py-[9px]">RECEIPT</th><th className="px-3 py-[9px]">CUSTOMER</th><th className="px-3 py-[9px]">PAYMENT</th><th className="px-3 py-[9px] text-right">AMOUNT</th><th className="px-5 py-[9px] text-right">TIME</th></tr></thead><tbody>{rows.length ? rows.map((item) => <TransactionRow key={item.receipt} transaction={item} />) : <tr><td colSpan={5} className="px-4 py-9 text-center text-[11px] text-muted-foreground">No sample activity matches this search.</td></tr>}</tbody></table></div>
      <div className="border-t border-border px-5 py-[11px]"><span className="text-[10px] text-muted-foreground">Illustrative activity · Not recorded transactions</span></div>
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return <tr className="border-b border-border/80 last:border-0 hover:bg-muted/40"><td className="whitespace-nowrap px-5 py-3 text-[11px] font-medium text-primary">{transaction.receipt}</td><td className="whitespace-nowrap px-3 py-3"><span className="flex items-center gap-2"><span className="flex size-[25px] items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">{transaction.initials}</span><span className="text-[11px] text-card-foreground">{transaction.customer}</span></span></td><td className="px-3 py-3"><span className={`inline-flex min-h-[23px] items-center gap-1 rounded-[5px] px-2 text-[10px] font-medium ${transaction.method === "M-Pesa" ? "bg-emerald-subtle text-emerald" : transaction.method === "Cash" ? "bg-muted text-muted-foreground" : "bg-blue/10 text-blue"}`}><CreditCard aria-hidden="true" className="size-[11px]" />{transaction.method}</span></td><td className="whitespace-nowrap px-3 py-3 text-right text-[11px] font-semibold text-card-foreground">{formatKes(transaction.amount)}</td><td className="whitespace-nowrap px-5 py-3 text-right text-[10px] text-muted-foreground">{transaction.time}</td></tr>;
}

function StockOverview({ searchQuery }: { searchQuery: string }) {
  const products = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return lowStockProducts.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(query));
  }, [searchQuery]);

  return (
    <section aria-labelledby="stock-title" className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_var(--card-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-[17px] sm:px-5"><div><h2 id="stock-title" className="text-[14px] font-semibold text-card-foreground">Low stock alerts</h2><p className="mt-1 text-[11px] text-muted-foreground">Illustrative stock levels</p></div><span className="inline-flex h-6 items-center gap-1 rounded-md bg-amber/10 px-2 text-[10px] font-medium text-amber"><FileWarning aria-hidden="true" className="size-3" />{products.length} items</span></div>
      <div className="dashboard-table-scroller overflow-x-auto"><table className="w-full min-w-[420px] border-collapse text-left"><thead><tr className="border-y border-border bg-muted/50 text-[10px] font-medium text-muted-foreground"><th className="px-5 py-[9px]">PRODUCT</th><th className="px-3 py-[9px]">SKU</th><th className="px-3 py-[9px] text-right">STOCK</th><th className="px-5 py-[9px] text-right">PRICE</th></tr></thead><tbody>{products.length ? products.map((item) => <tr key={item.sku} className="border-b border-border/80 last:border-0 hover:bg-muted/40"><td className="px-5 py-[10px]"><span className="flex items-center gap-2.5"><img src={item.photo === "storage" ? storageImage : safetyImage} alt={item.alt} className="size-9 shrink-0 rounded-md border border-border object-cover" /><span className="max-w-[150px] truncate text-[11px] font-medium text-card-foreground">{item.name}</span></span></td><td className="whitespace-nowrap px-3 py-[10px] text-[10px] text-muted-foreground">{item.sku}</td><td className="whitespace-nowrap px-3 py-[10px] text-right"><span className={`text-[11px] font-semibold ${item.remaining <= 3 ? "text-destructive" : "text-amber"}`}>{item.remaining}</span><span className="text-[10px] text-muted-foreground"> / {item.total}</span></td><td className="whitespace-nowrap px-5 py-[10px] text-right text-[11px] text-card-foreground">{formatKes(item.price)}</td></tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-[11px] text-muted-foreground">No products match this search.</td></tr>}</tbody></table></div>
      <div className="border-t border-border px-5 py-[11px]"><span className="text-[10px] text-muted-foreground">Preview only · Confirm actual stock before ordering</span></div>
    </section>
  );
}

function PaymentsOverview() {
  const total = paymentMethods.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section aria-labelledby="payments-title" className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary"><CircleDollarSign aria-hidden="true" className="size-4" /></span><div><h2 id="payments-title" className="text-[13px] font-semibold text-card-foreground">Payment methods</h2><p className="mt-0.5 text-[10px] text-muted-foreground">{formatKes(total)} · sample</p></div></div><ul className="mt-4 space-y-3">{paymentMethods.map((item) => <li key={item.name}><div className="mb-1 flex justify-between gap-2"><span className="text-[11px] text-muted-foreground">{item.name}</span><span className="text-[11px] font-medium text-card-foreground">{item.percent}%</span></div><div className="h-[5px] overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} /></div></li>)}</ul></section>
  );
}

function TeamActivity() {
  return (
    <section aria-labelledby="activity-title" className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"><div className="flex items-center justify-between"><div><h2 id="activity-title" className="text-[14px] font-semibold text-card-foreground">Team activity</h2><p className="mt-1 text-[11px] text-muted-foreground">A sample of recent updates</p></div><Activity aria-hidden="true" className="size-4 text-muted-foreground" /></div><ul className="mt-5 space-y-4">{previewActivities.map((item) => <li key={`${item.actor}-${item.time}`} className="flex gap-3"><span className="mt-[5px] flex size-[9px] shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: item.color }}><span className="size-[3px] rounded-full bg-card" /></span><div className="min-w-0 flex-1"><p className="text-[11px] leading-[1.55] text-card-foreground"><span className="font-semibold">{item.actor}</span> {item.action}.</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.detail}</p><p className="mt-1 text-[9px] text-muted-foreground">{item.time}</p></div></li>)}</ul></section>
  );
}

export function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("Last 7 days");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const metrics = overviewByRange[range];

  useEffect(() => {
    const updateDate = () => setDate(getNairobiDate());
    updateDate();
    const interval = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div id="dashboard" className="dashboard-shell flex min-h-screen w-full bg-background text-foreground">
      <aside className={`dashboard-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-[72px]" : "w-[238px]"}`}>
        <SidebarContents collapsed={sidebarCollapsed} />
        <Button type="button" variant="ghost" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="h-[46px] shrink-0 justify-start gap-3 rounded-none border-t border-sidebar-border px-6 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"><ArrowDown aria-hidden="true" className={`size-4 ${sidebarCollapsed ? "rotate-90" : "-rotate-90"}`} />{!sidebarCollapsed && <span className="text-[11px]">Collapse sidebar</span>}</Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="dashboard-topbar sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Open navigation" className="-ml-2 shrink-0 text-foreground lg:hidden"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" aria-label="Main navigation" className="flex h-dvh w-[min(320px,88vw)] max-w-none flex-col gap-0 overflow-hidden border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:w-80"><SheetHeader className="sr-only"><SheetTitle>Samul Bikers POS navigation</SheetTitle><SheetDescription>Business management menu</SheetDescription></SheetHeader><SidebarContents collapsed={false} closeMenu={() => setMenuOpen(false)} /></SheetContent>
            </Sheet>
            <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate font-display text-[16px] font-semibold text-foreground sm:text-[17px]">Dashboard</h1><span className="hidden h-5 items-center rounded border border-border px-1.5 text-[9px] font-medium text-muted-foreground sm:inline-flex"><Command aria-hidden="true" className="mr-1 size-2.5" />1</span></div><p className="hidden truncate text-[10px] text-muted-foreground sm:block">Your business at a glance</p></div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <label className="dashboard-search hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 lg:flex"><Search aria-hidden="true" className="size-[15px] shrink-0 text-muted-foreground" /><Input aria-label="Search products, receipts, or customers" placeholder="Search anything..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-full w-[160px] border-0 bg-transparent px-0 py-0 text-[11px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0 xl:w-[210px]" /><span className="rounded border border-border px-1 text-[9px] text-muted-foreground">⌘K</span></label>
            <span className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-[10px] text-muted-foreground xl:inline-flex"><Activity aria-hidden="true" className="size-3.5 text-emerald" />Nairobi{date && ` · ${date}`}</span>
            <Sheet><SheetTrigger asChild><Button type="button" variant="ghost" size="icon" title="Preview notifications" aria-label="Preview notifications" className="relative size-9 shrink-0 text-muted-foreground"><Bell /><span aria-hidden="true" className="absolute right-[7px] top-[7px] size-[7px] rounded-full border-[1.5px] border-background bg-amber" /></Button></SheetTrigger><SheetContent side="right" className="w-[min(370px,92vw)] sm:w-[390px]"><SheetHeader><SheetTitle>Notifications</SheetTitle><SheetDescription>Preview alerts · Sample data</SheetDescription></SheetHeader><ul className="mt-6 divide-y divide-border"><li className="flex gap-3 py-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber/10 text-amber"><Boxes aria-hidden="true" className="size-4" /></span><span><span className="block text-[12px] font-medium text-foreground">3 products need attention</span><span className="mt-1 block text-[11px] text-muted-foreground">Check availability before placing an order.</span></span></li><li className="flex gap-3 py-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Activity aria-hidden="true" className="size-4" /></span><span><span className="block text-[12px] font-medium text-foreground">Sample trading activity ready</span><span className="mt-1 block text-[11px] text-muted-foreground">Illustrative only — no real transactions recorded.</span></span></li></ul></SheetContent></Sheet>
            <span className="mx-1 hidden h-7 w-px bg-border sm:block" /><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[10px] font-semibold text-primary">SM</span><span className="hidden leading-tight sm:block"><span className="block text-[11px] font-medium text-foreground">Store manager</span><span className="mt-0.5 block text-[9px] text-muted-foreground">Preview workspace</span></span>
          </div>
        </header>

        <main className="dashboard-main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 pb-8 pt-5 sm:gap-[22px] sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pt-7">
          <section className="flex flex-wrap items-center justify-between gap-3" aria-label="Dashboard overview and date range"><div><p className="text-[12px] text-muted-foreground">Welcome back</p><p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-foreground"><span className="font-display text-[17px] font-semibold">Samul Bikers Haven</span><span className="hidden h-4 w-px bg-border sm:block" /><span className="inline-flex h-7 items-center gap-2 rounded-md border border-border bg-card px-2 text-[10px] font-medium text-foreground"><span aria-hidden="true" className="size-[7px] rounded-full bg-emerald" />Main branch</span><span className="hidden text-[10px] font-normal text-muted-foreground md:block">Nairobi, Kenya</span></p></div><div className="flex w-full items-center gap-2 sm:w-auto"><SampleDataLabel /><span className="flex-1 sm:hidden" /><label className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground"><span className="sr-only">Sales period</span><span aria-hidden="true" className="text-muted-foreground"><ArrowUpRight className="size-[13px] rotate-90" /></span><select aria-label="Dashboard date range" value={range} onChange={(event) => setRange(event.target.value as DashboardRange)} className="min-w-0 cursor-pointer appearance-none border-0 bg-transparent text-[11px] text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">{dateRanges.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" /></label></div></section>

          <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[14px]"><Metric icon={CircleDollarSign} title="Total sales" value={formatKes(metrics.revenue)} change={metrics.change} note="vs previous period" color="var(--chart-1)" /><Metric icon={ReceiptText} title="Transactions" value={String(metrics.transactions)} change="8.1%" note="vs previous period" color="var(--chart-4)" /><Metric icon={TrendingUp} title="Gross profit" value={formatKes(metrics.profit)} change="6.4%" note="sample product costs" color="var(--chart-2)" /><Metric icon={PackageCheck} title="Products in stock" value="1,286" note="Sample inventory · 3 low" color="var(--chart-3)" /></section>

          <section aria-label="Sales and product categories" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(285px,0.9fr)]"><SalesOverview range={range} /><CategoryOverview /></section>

          <section aria-label="Recent sales and stock alerts" className="grid grid-cols-1 gap-4 2xl:grid-cols-2"><TransactionsPanel searchQuery={search} /><StockOverview searchQuery={search} /></section>

          <section aria-label="Payments, activity, and business information" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"><PaymentsOverview /><TeamActivity /><aside aria-label="Business status" className="flex min-h-40 flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_var(--card-shadow)] sm:p-5"><div className="flex items-center justify-between gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary"><ShieldCheck aria-hidden="true" className="size-[17px]" /></span><span className="flex h-6 items-center gap-1.5 rounded-md bg-emerald-subtle px-2 text-[10px] font-medium text-emerald"><Check aria-hidden="true" className="size-3" />Preview workspace</span></div><div className="mt-5"><p className="font-display text-[16px] font-semibold text-card-foreground">Samul Bikers POS</p><p className="mt-1.5 max-w-[280px] text-[11px] leading-[1.6] text-muted-foreground">A business management preview for Samul Bikers Haven, Nairobi, Kenya.</p></div></aside></section>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground"><span>Samul Bikers POS · Business Technology. Simplified.</span><span className="inline-flex items-center gap-1.5"><EyeIcon />Illustrative figures only · Preview workspace</span></footer>
        </main>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <ShieldCheck aria-hidden="true" className="size-3.5" />;
}