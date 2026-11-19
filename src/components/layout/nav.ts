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
  type LucideIcon,
} from "lucide-react";

import { canAccessPath, type AppRole } from "@/lib/auth/roles";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function navigationForRole(role: AppRole | null | undefined): NavGroup[] {
  if (!role) return navigationGroups;

  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPath(role, item.to)),
    }))
    .filter((group) => group.items.length > 0);
}

export const navigationGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", to: "/", icon: Gauge, description: "Your business at a glance" },
      { label: "Point of sale", to: "/pos", icon: ShoppingCart, description: "Ring up a sale in seconds" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Sales", to: "/sales", icon: ReceiptText, description: "Receipts, refunds and daily takings" },
      { label: "Products", to: "/products", icon: ShoppingBag, description: "Catalogue, pricing and margins" },
      { label: "Inventory", to: "/inventory", icon: Boxes, description: "Stock levels and movements", badge: "3" },
      { label: "Categories", to: "/categories", icon: LayoutGrid, description: "Product groups and performance" },
      { label: "Suppliers", to: "/suppliers", icon: Truck, description: "Vendors and payment terms" },
      { label: "Purchases", to: "/purchases", icon: ClipboardList, description: "Purchase orders and deliveries" },
      { label: "Customers", to: "/customers", icon: ContactRound, description: "Buyers, spend and loyalty" },
      { label: "Expenses", to: "/expenses", icon: CircleDollarSign, description: "Operating costs and approvals" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Reports & analytics", to: "/reports", icon: ChartNoAxesCombined, description: "Trends, margins and top sellers" },
      { label: "Staff & users", to: "/staff", icon: UsersRound, description: "Team roles and shifts" },
      { label: "Branches", to: "/branches", icon: Store, description: "Locations and performance" },
      { label: "Settings", to: "/settings", icon: Settings2, description: "Business, receipts and appearance" },
    ],
  },
];

export const flatNavItems = navigationGroups.flatMap((group) => group.items);
