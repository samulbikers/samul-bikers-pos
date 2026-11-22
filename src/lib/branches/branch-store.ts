import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requireSupabase } from "@/lib/supabase/client";
import type { DbBranch } from "@/lib/supabase/types";

export type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  staff: number;
  monthlyRevenue: number;
  stockValue: number;
  status: "Open" | "Closing soon" | "Closed";
};

export type BranchInput = {
  name: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
};

export const branchKeys = {
  all: ["pos-branches"] as const,
};

export function toBranch(row: DbBranch): Branch {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    manager: row.manager,
    phone: row.phone,
    staff: row.staff,
    monthlyRevenue: Number(row.monthly_revenue),
    stockValue: Number(row.stock_value),
    status: row.status as Branch["status"],
  };
}

export function useBranches(): Branch[] {
  const query = useQuery({
    queryKey: branchKeys.all,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("pos_branches")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as DbBranch[]).map(toBranch);
    },
  });

  return query.data ?? [];
}

function useBranchMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useCreateBranch() {
  return useBranchMutation(async (input: BranchInput) => {
    const { data, error } = await requireSupabase()
      .from("pos_branches")
      .insert({
        id: `br-${Date.now().toString(36)}`,
        name: input.name.trim(),
        city: input.city.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        manager: input.manager.trim(),
        status: "Open",
        staff: 0,
        monthly_revenue: 0,
        stock_value: 0,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toBranch(data as DbBranch);
  });
}

export function useUpdateBranch() {
  return useBranchMutation(async (input: { id: string } & BranchInput) => {
    const { data, error } = await requireSupabase()
      .from("pos_branches")
      .update({
        name: input.name.trim(),
        city: input.city.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        manager: input.manager.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return toBranch(data as DbBranch);
  });
}

export function useDeleteBranch() {
  return useBranchMutation(async (id: string) => {
    const { data, error } = await requireSupabase()
      .from("pos_branches")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Branch could not be deleted.");
    return id;
  });
}
