import { useMutation, useQueryClient } from "@tanstack/react-query";

import { requireSupabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/queries";
import type { DbCustomer, DbSale } from "@/lib/supabase/types";

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

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      phone?: string | undefined;
      email?: string | undefined;
      location?: string | undefined;
      tier?: DbCustomer["tier"] | undefined;
    }) => {
      const { data, error } = await requireSupabase()
        .from("pos_customers")
        .insert({
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          location: input.location ?? null,
          tier: input.tier ?? "New",
        })
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
