import { requireSupabase } from "@/lib/supabase/client";
import type { DbStaffAccount } from "@/lib/supabase/types";
import type { AppRole } from "./roles";

export type AuthAccount = {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  branchId?: string | undefined;
  shift?: string | undefined;
  createdAt: string;
  source: "seed" | "manager";
};

export type AuthSession = {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  branchId?: string | undefined;
};

export type NewStaffInput = {
  name: string;
  username: string;
  pin: string;
  role: "cashier" | "manager";
  branchId: string;
  shift: string;
};

export type UpdateStaffInput = {
  name: string;
  username: string;
  role: "cashier" | "manager";
  branchId: string;
  shift: string;
};

export type NewCashierInput = Omit<NewStaffInput, "role">;

export type AccountResult = { ok: true; account: AuthAccount } | { ok: false; error: string };

const SESSION_KEY = "samul-pos-session";
const roles: AppRole[] = ["owner", "manager", "cashier"];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function toAccount(row: DbStaffAccount): AuthAccount {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    branchId: row.branch_id ?? undefined,
    shift: row.shift,
    createdAt: row.created_at,
    source: row.source,
  };
}

export async function loadAccounts(): Promise<AuthAccount[]> {
  const { data, error } = await requireSupabase().rpc("pos_staff_list");
  if (error) throw error;
  return ((data ?? []) as DbStaffAccount[]).map(toAccount);
}

export async function authenticate(username: string, pin: string): Promise<AuthAccount | null> {
  const { data, error } = await requireSupabase().rpc("pos_staff_login", {
    p_username: username.trim(),
    p_pin: pin,
  });
  if (error) throw error;
  const rows = (data ?? []) as DbStaffAccount[];
  return rows[0] ? toAccount(rows[0]) : null;
}

export function toSession(account: AuthAccount): AuthSession {
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role,
    branchId: account.branchId,
  };
}

export function loadSession(): AuthSession | null {
  if (!hasStorage()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const session = parsed as Record<string, unknown>;
    if (
      typeof session["id"] !== "string" ||
      typeof session["name"] !== "string" ||
      typeof session["username"] !== "string" ||
      !roles.includes(session["role"] as AppRole)
    ) {
      return null;
    }

    return {
      id: session["id"],
      name: session["name"],
      username: session["username"],
      role: session["role"] as AppRole,
      branchId: typeof session["branchId"] === "string" ? session["branchId"] : undefined,
    };
  } catch {
    return null;
  }
}

export function saveSession(account: AuthAccount) {
  if (!hasStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(toSession(account)));
}

export function clearSession() {
  if (!hasStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

function failure(error: unknown): AccountResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Unexpected error",
  };
}

export async function createStaffAccount(input: NewStaffInput): Promise<AccountResult> {
  try {
    const { data, error } = await requireSupabase().rpc("pos_staff_create", {
      p_name: input.name.trim(),
      p_username: input.username.trim().toLowerCase(),
      p_pin: input.pin,
      p_role: input.role,
      p_branch_id: input.branchId,
      p_shift: input.shift,
    });
    if (error) throw error;
    const row = ((data ?? []) as DbStaffAccount[])[0];
    if (!row) throw new Error("The account was not created.");
    return { ok: true, account: toAccount(row) };
  } catch (error) {
    return failure(error);
  }
}

export async function createCashierAccount(input: NewCashierInput): Promise<AccountResult> {
  return createStaffAccount({ ...input, role: "cashier" });
}

export async function updateStaffAccount(
  accountId: string,
  input: UpdateStaffInput,
): Promise<AccountResult> {
  try {
    const { data, error } = await requireSupabase().rpc("pos_staff_update", {
      p_id: accountId,
      p_name: input.name.trim(),
      p_username: input.username.trim().toLowerCase(),
      p_role: input.role,
      p_branch_id: input.branchId,
      p_shift: input.shift,
    });
    if (error) throw error;
    const row = ((data ?? []) as DbStaffAccount[])[0];
    if (!row) throw new Error("The account was not updated.");
    return { ok: true, account: toAccount(row) };
  } catch (error) {
    return failure(error);
  }
}

export async function resetAccountPin(accountId: string, pin: string): Promise<AccountResult> {
  try {
    const { data, error } = await requireSupabase().rpc("pos_staff_reset_pin", {
      p_id: accountId,
      p_pin: pin,
    });
    if (error) throw error;
    const row = ((data ?? []) as DbStaffAccount[])[0];
    if (!row) throw new Error("The PIN was not reset.");
    return { ok: true, account: toAccount(row) };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffAccount(accountId: string): Promise<AccountResult> {
  try {
    const { data, error } = await requireSupabase().rpc("pos_staff_delete", {
      p_id: accountId,
    });
    if (error) throw error;
    return {
      ok: true,
      account: {
        id: accountId,
        name: "",
        username: "",
        role: "cashier",
        createdAt: new Date().toISOString(),
        source: "manager",
      },
    };
  } catch (error) {
    return failure(error);
  }
}
