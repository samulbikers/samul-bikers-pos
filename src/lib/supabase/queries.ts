import { useQuery } from "@tanstack/react-query";

import { requireSupabase } from "@/lib/supabase/client";
import type {
  DbCategory,
  DbCustomer,
  DbExpense,
  DbMovement,
  DbProduct,
  DbPurchaseOrder,
  DbSale,
  DbSiteSettings,
  DbSupplier,
  StockStatus,
} from "@/lib/supabase/types";

export const queryKeys = {
  products: ["catalog-products"] as const,
  categories: ["catalog-categories"] as const,
  settings: ["site-settings"] as const,
  customers: ["pos-customers"] as const,
  sales: ["pos-sales"] as const,
  movements: ["pos-movements"] as const,
  expenses: ["pos-expenses"] as const,
  suppliers: ["pos-suppliers"] as const,
  purchaseOrders: ["pos-purchase-orders"] as const,
};

export type CatalogProduct = {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  image: string | null;
  images: string[];
  categoryId: string | null;
  categoryName: string;
  price: number;
  listPrice: number;
  cost: number | null;
  margin: number | null;
  stock: number;
  reorderLevel: number;
  stockStatus: StockStatus;
  isFeatured: boolean;
};

function skuFor(product: DbProduct) {
  if (product.sku) return product.sku;
  return product.slug.replace(/[^a-z0-9]+/gi, "-").slice(0, 14).toUpperCase();
}

export function toCatalogProduct(product: DbProduct): CatalogProduct {
  const listPrice = Number(product.price);
  const price =
    product.has_discount && product.discount_price !== null ? Number(product.discount_price) : listPrice;
  const cost = product.cost_price === null ? null : Number(product.cost_price);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    sku: skuFor(product),
    description: product.description,
    shortDescription: product.short_description,
    image: product.images?.[0] ?? null,
    images: product.images ?? [],
    categoryId: product.category_id,
    categoryName: product.categories?.name ?? "Uncategorised",
    price,
    listPrice,
    cost,
    margin: cost === null || price <= 0 ? null : ((price - cost) / price) * 100,
    stock: product.stock_quantity ?? 0,
    reorderLevel: product.reorder_level ?? 5,
    stockStatus: product.stock_status,
    isFeatured: product.is_featured,
  };
}

const PRODUCT_SELECT =
  "id,title,slug,description,short_description,images,price,show_price,has_discount,discount_price,stock_status,stock_quantity,cost_price,reorder_level,sku,is_featured,category_id,updated_at,categories(name,slug)";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("products")
        .select(PRODUCT_SELECT)
        .order("title", { ascending: true });

      if (error) throw error;
      return (data as unknown as DbProduct[]).map(toCatalogProduct);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("categories")
        .select("id,name,slug,blurb,image_url,sort_order")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as DbCategory[];
    },
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("site_settings")
        .select("business_name,tagline,short_description,phone,phone_e164,whatsapp,email,address_line1,address_line2,city,county,country")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as DbSiteSettings | null) ?? null;
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_customers")
        .select("id,name,phone,email,location,tier,notes,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DbCustomer[];
    },
  });
}

export function useSales(limit = 200) {
  return useQuery({
    queryKey: [...queryKeys.sales, limit],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_sales")
        .select("id,receipt,customer_id,customer_name,cashier,branch,payment_method,subtotal,discount,vat,total,status,payment_reference,created_at,pos_sale_items(id,product_id,product_title,quantity,unit_price,line_total)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as DbSale[];
    },
  });
}

export function useStockMovements(limit = 40) {
  return useQuery({
    queryKey: [...queryKeys.movements, limit],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_inventory_movements")
        .select("id,product_id,product_title,movement_type,quantity,reference,user_name,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as DbMovement[];
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_expenses")
        .select("id,reference,category,description,amount,paid_by,approved_by,spent_on")
        .order("spent_on", { ascending: false });

      if (error) throw error;
      return data as DbExpense[];
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_suppliers")
        .select("id,name,contact_name,phone,email,terms,lead_time_days,rating,outstanding")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as DbSupplier[];
    },
  });
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: queryKeys.purchaseOrders,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_purchase_orders")
        .select("id,reference,supplier_id,supplier_name,status,ordered_on,expected_on,items,amount")
        .order("ordered_on", { ascending: false });

      if (error) throw error;
      return data as DbPurchaseOrder[];
    },
  });
}
