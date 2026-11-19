import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  ContactRound,
  Gauge,
  LayoutGrid,
  ReceiptText,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UsersRound,
} from "lucide-react";

export type DashboardRange = "Today" | "Yesterday" | "Last 7 days" | "Last 30 days" | "This month";

type NavigationItem = { label: string; icon: LucideIcon; badge?: string };

type NavigationGroup = { label: string; items: NavigationItem[] };

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: Gauge },
      { label: "Point of sale", icon: ShoppingCart },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Sales", icon: ReceiptText },
      { label: "Products", icon: ShoppingBag },
      { label: "Inventory", icon: Boxes, badge: "3" },
      { label: "Categories", icon: LayoutGrid },
      { label: "Suppliers", icon: Truck },
      { label: "Purchases", icon: ClipboardList },
      { label: "Customers", icon: ContactRound },
      { label: "Expenses", icon: CircleDollarSign },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Reports & analytics", icon: ChartNoAxesCombined },
      { label: "Staff & users", icon: UsersRound },
      { label: "Branches", icon: Store },
      { label: "Settings", icon: Settings2 },
    ],
  },
];

export const dateRanges: DashboardRange[] = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "This month",
];

export const overviewByRange: Record<DashboardRange, {
  revenue: number;
  transactions: number;
  profit: number;
  change: string;
  chart: number[];
}> = {
  Today: { revenue: 26480, transactions: 9, profit: 8940, change: "+6.2%", chart: [28, 48, 38, 62, 48, 82, 65] },
  Yesterday: { revenue: 74150, transactions: 21, profit: 24430, change: "+2.8%", chart: [32, 41, 64, 49, 71, 57, 86] },
  "Last 7 days": { revenue: 386420, transactions: 128, profit: 127610, change: "+12.8%", chart: [35, 49, 43, 70, 57, 80, 66, 91, 75, 84, 64, 93] },
  "Last 30 days": { revenue: 1586420, transactions: 526, profit: 523960, change: "+8.4%", chart: [32, 41, 37, 58, 45, 52, 72, 59, 75, 64, 86, 77, 68, 91] },
  "This month": { revenue: 1206420, transactions: 401, profit: 397120, change: "+10.3%", chart: [35, 43, 38, 56, 52, 72, 60, 68, 83, 71, 91, 81, 89] },
};

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const salesByCategory = [
  { name: "Riding gear", percent: 38, amount: 147_620, color: "var(--chart-1)" },
  { name: "Tail boxes", percent: 27, amount: 104_330, color: "var(--chart-2)" },
  { name: "Accessories", percent: 22, amount: 85_020, color: "var(--chart-3)" },
  { name: "Safety gear", percent: 13, amount: 49_450, color: "var(--chart-4)" },
];

export type Transaction = {
  receipt: string;
  customer: string;
  initials: string;
  method: "M-Pesa" | "Cash" | "Card";
  amount: number;
  time: string;
};

export const recentTransactions: Transaction[] = [
  { receipt: "SBH-02481", customer: "Kevin Mutua", initials: "KM", method: "M-Pesa", amount: 18500, time: "09:42" },
  { receipt: "SBH-02480", customer: "Angela Wanjiru", initials: "AW", method: "Cash", amount: 6200, time: "09:18" },
  { receipt: "SBH-02479", customer: "Brian Ochieng", initials: "BO", method: "M-Pesa", amount: 24800, time: "08:56" },
  { receipt: "SBH-02478", customer: "Walk-in customer", initials: "WC", method: "Card", amount: 12400, time: "08:32" },
  { receipt: "SBH-02477", customer: "Grace Njeri", initials: "GN", method: "M-Pesa", amount: 9600, time: "08:11" },
];

export const lowStockProducts = [
  { name: "Full-face riding helmet", sku: "GEAR-0142", remaining: 3, total: 16, price: 12500, photo: "safety", alt: "Black motorcycle helmet and protective gloves" },
  { name: "Lockable touring tail box", sku: "STOR-0078", remaining: 5, total: 20, price: 9800, photo: "storage", alt: "Black lockable motorcycle touring box" },
  { name: "Waterproof riding gloves", sku: "GEAR-0195", remaining: 2, total: 12, price: 3200, photo: "safety", alt: "Protective leather motorcycle gloves" },
];

export const previewActivities = [
  { actor: "Miriam W.", action: "recorded a sale", detail: "Receipt SBH-02481", time: "12 minutes ago", color: "var(--chart-1)" },
  { actor: "James K.", action: "received new stock", detail: "Touring tail boxes · 12 units", time: "38 minutes ago", color: "var(--chart-2)" },
  { actor: "Miriam W.", action: "registered a customer", detail: "Brian Ochieng", time: "1 hour ago", color: "var(--chart-3)" },
];

export const paymentMethods = [
  { name: "M-Pesa", percent: 62, amount: 239580, color: "var(--chart-1)" },
  { name: "Cash", percent: 26, amount: 100470, color: "var(--chart-3)" },
  { name: "Card / bank", percent: 12, amount: 46370, color: "var(--chart-4)" },
];