import { useMutation, useQueryClient } from "@tanstack/react-query";

import { requireSupabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/queries";
import type {
  DbCategory,
  DbCustomer,
  DbExpense,
  DbProduct,
  DbPurchaseOrder,
  DbSale,
  DbSupplier,
} from "@/lib/supabase/types";

export type SaleLineInput = {
  product_id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
};

export type CompleteSaleInput = {
  customerId: string | null;
  customerName: string;
  cashier: string;
  paymentMethod: "M-Pesa" | "Cash" | "Card";
  discount: number;
  lines: SaleLineInput[];
};

function invalidateSalesData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.sales });
  void queryClient.invalidateQueries({ queryKey: queryKeys.products });
  void queryClient.invalidateQueries({ queryKey: queryKeys.movements });
}

export function useCompleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteSaleInput) => {
      const { data, error } = await requireSupabase().rpc("pos_complete_sale", {
        p_customer_id: input.customerId,
        p_customer_name: input.customerName,
        p_cashier: input.cashier,
        p_payment_method: input.paymentMethod,
        p_discount: input.discount,
        p_lines: input.lines,
      });

      if (error) throw error;
      return data as DbSale;
    },
    onSuccess: () => invalidateSalesData(queryClient),
  });
}

export function useSetSalePaymentReference() {
  return useEntityMutation(async (input: { saleId: string; reference: string }) => {
    const { error } = await requireSupabase().rpc("pos_set_sale_payment_reference", {
      p_sale_id: input.saleId,
      p_reference: input.reference,
    });
    if (error) throw error;
    return input.saleId;
  }, [queryKeys.sales]);
}

export function useRefundSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      const { data, error } = await requireSupabase().rpc("pos_refund_sale", { p_sale_id: saleId });
      if (error) throw error;
      return data as DbSale;
    },
    onSuccess: () => invalidateSalesData(queryClient),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      stock?: number | undefined;
      cost?: number | undefined;
      reorder?: number | undefined;
    }) => {
      const { data, error } = await requireSupabase().rpc("pos_update_product", {
        p_id: input.id,
        p_stock: input.stock ?? null,
        p_cost: input.cost ?? null,
        p_reorder: input.reorder ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
      void queryClient.invalidateQueries({ queryKey: queryKeys.movements });
    },
  });
}

const BLOCKED_WRITE =
  "Supabase blocked this change (row-level security). Ask the project owner to allow INSERT/UPDATE/DELETE for this table, then try again.";

function confirmRows(data: { id: string }[] | null) {
  if (!data?.length) throw new Error(BLOCKED_WRITE);
}

function useEntityMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  keys: readonly (readonly unknown[])[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

export type CustomerInput = {
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  tier: DbCustomer["tier"];
};

export function useUpdateCustomer() {
  return useEntityMutation(async (input: { id: string } & CustomerInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("pos_customers")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.customers]);
}

export function useDeleteCustomer() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase()
      .from("pos_customers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.customers, queryKeys.sales]);
}

export type ExpenseInput = {
  reference: string;
  category: DbExpense["category"];
  description: string;
  amount: number;
  paid_by: string;
  approved_by: string;
  spent_on: string;
};

export function useCreateExpense() {
  return useEntityMutation(async (input: ExpenseInput) => {
    const { data, error } = await requireSupabase()
      .from("pos_expenses")
      .insert(input)
      .select("id,reference,category,description,amount,paid_by,approved_by,spent_on")
      .single();
    if (error) throw error;
    return data as DbExpense;
  }, [queryKeys.expenses]);
}

export function useUpdateExpense() {
  return useEntityMutation(async (input: { id: string } & ExpenseInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("pos_expenses")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.expenses]);
}

export function useDeleteExpense() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase()
      .from("pos_expenses")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.expenses]);
}

export type SupplierInput = {
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  terms: string;
  lead_time_days: number;
  rating: number | null;
  outstanding: number;
};

export function useCreateSupplier() {
  return useEntityMutation(async (input: SupplierInput) => {
    const { data, error } = await requireSupabase()
      .from("pos_suppliers")
      .insert(input)
      .select("id,name,contact_name,phone,email,terms,lead_time_days,rating,outstanding")
      .single();
    if (error) throw error;
    return data as DbSupplier;
  }, [queryKeys.suppliers]);
}

export function useUpdateSupplier() {
  return useEntityMutation(async (input: { id: string } & SupplierInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("pos_suppliers")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.suppliers]);
}

export function useDeleteSupplier() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase()
      .from("pos_suppliers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.suppliers]);
}

export type PurchaseOrderInput = {
  reference: string;
  supplier_id: string | null;
  supplier_name: string;
  status: DbPurchaseOrder["status"];
  ordered_on: string;
  expected_on: string | null;
  items: number;
  amount: number;
};

export function useCreatePurchaseOrder() {
  return useEntityMutation(async (input: PurchaseOrderInput) => {
    const { data, error } = await requireSupabase()
      .from("pos_purchase_orders")
      .insert(input)
      .select("id,reference,supplier_id,supplier_name,status,ordered_on,expected_on,items,amount")
      .single();
    if (error) throw error;
    return data as DbPurchaseOrder;
  }, [queryKeys.purchaseOrders]);
}

export function useUpdatePurchaseOrder() {
  return useEntityMutation(async (input: { id: string } & PurchaseOrderInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("pos_purchase_orders")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.purchaseOrders]);
}

export function useDeletePurchaseOrder() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase()
      .from("pos_purchase_orders")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.purchaseOrders]);
}

export type CategoryInput = {
  name: string;
  slug: string;
  blurb: string;
  image_url: string | null;
  sort_order: number;
};

export function useCreateCategory() {
  return useEntityMutation(async (input: CategoryInput) => {
    const { data, error } = await requireSupabase()
      .from("categories")
      .insert(input)
      .select("id,name,slug,blurb,image_url,sort_order")
      .single();
    if (error) throw error;
    return data as DbCategory;
  }, [queryKeys.categories]);
}

export function useUpdateCategory() {
  return useEntityMutation(async (input: { id: string } & CategoryInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("categories")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.categories]);
}

export function useDeleteCategory() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase().from("categories").delete().eq("id", id).select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.categories]);
}

export type ProductInput = {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string | null;
  images: string[];
  price: number;
  show_price: boolean;
  has_discount: boolean;
  discount_price: number | null;
  stock_status: DbProduct["stock_status"];
  stock_quantity: number;
  cost_price: number | null;
  reorder_level: number;
  sku: string | null;
  is_featured: boolean;
};

export function useCreateProduct() {
  return useEntityMutation(async (input: ProductInput) => {
    const { data, error } = await requireSupabase()
      .from("products")
      .insert(input)
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  }, [queryKeys.products, queryKeys.movements]);
}

export function useUpdateProductDetails() {
  return useEntityMutation(async (input: { id: string } & ProductInput) => {
    const { id, ...values } = input;
    const { data, error } = await requireSupabase()
      .from("products")
      .update(values)
      .eq("id", id)
      .select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.products]);
}

export function useDeleteProduct() {
  return useEntityMutation(async (id: string) => {
    const { data, error } = await requireSupabase().from("products").delete().eq("id", id).select("id");
    if (error) throw error;
    confirmRows(data as { id: string }[] | null);
    return id;
  }, [queryKeys.products, queryKeys.movements]);
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const { data, error } = await requireSupabase()
        .from("pos_customers")
        .insert(input)
        .select("id,name,phone,email,location,tier,notes,created_at")
        .single();

      if (error) throw error;
      return data as DbCustomer;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}
