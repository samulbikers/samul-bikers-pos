import type { AppRole } from "./roles";

export type AuthAccount = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  password: string;
  branchId?: string;
  shift?: string;
  createdAt: string;
  source: "seed" | "manager";
};

export type AuthSession = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export type NewCashierInput = {
  name: string;
  email: string;
  password: string;
  branchId: string;
  shift: string;
};

type CashierResult =
  | { ok: true; account: AuthAccount; accounts: AuthAccount[] }
  | { ok: false; error: string };

const ACCOUNTS_KEY = "samul-pos-accounts";
const SESSION_KEY = "samul-pos-session";

// Preview-only sign-in: credentials live in this browser so role access can be
// tried without a backend. Replace with Supabase auth before going live.
export const seedAccounts: AuthAccount[] = [
  {
    id: "acct-owner",
    name: "Samson Muli",
    email: "samson@samulbikers.co.ke",
    role: "owner",
    password: "owner123",
    createdAt: "2026-01-05T08:00:00.000Z",
    source: "seed",
  },
  {
    id: "acct-manager",
    name: "Miriam Wambui",
    email: "miriam@samulbikers.co.ke",
    role: "manager",
    password: "manager123",
    branchId: "br-01",
    shift: "08:00 – 17:00",
    createdAt: "2026-01-05T08:00:00.000Z",
    source: "seed",
  },
  {
    id: "acct-cashier-lucy",
    name: "Lucy Achieng",
    email: "lucy@samulbikers.co.ke",
    role: "cashier",
    password: "cashier123",
    branchId: "br-01",
    shift: "09:00 – 18:00",
    createdAt: "2026-01-05T08:00:00.000Z",
    source: "seed",
  },
  {
    id: "acct-cashier-esther",
    name: "Esther Njoki",
    email: "esther@samulbikers.co.ke",
    role: "cashier",
    password: "cashier123",
    branchId: "br-02",
    shift: "09:00 – 18:00",
    createdAt: "2026-01-05T08:00:00.000Z",
    source: "seed",
  },
];

export const demoAccounts = [
  { label: "Store manager", email: "miriam@samulbikers.co.ke", password: "manager123" },
  { label: "Cashier", email: "lucy@samulbikers.co.ke", password: "cashier123" },
] as const;

const roles: AppRole[] = ["owner", "manager", "cashier"];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isAccount(value: unknown): value is AuthAccount {
  if (!value || typeof value !== "object") return false;
  const account = value as Record<string, unknown>;
  return (
    typeof account["id"] === "string" &&
    typeof account["name"] === "string" &&
    typeof account["email"] === "string" &&
    typeof account["password"] === "string" &&
    roles.includes(account["role"] as AppRole)
  );
}

export function loadAccounts(): AuthAccount[] {
  if (!hasStorage()) return seedAccounts;

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seedAccounts));
      return seedAccounts;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedAccounts;

    const accounts = parsed.filter(isAccount);
    return accounts.length ? accounts : seedAccounts;
  } catch {
    return seedAccounts;
  }
}

function saveAccounts(accounts: AuthAccount[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function authenticate(email: string, password: string): AuthAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    loadAccounts().find(
      (account) =>
        account.email.toLowerCase() === normalizedEmail && account.password === password,
    ) ?? null
  );
}

export function toSession(account: AuthAccount): AuthSession {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
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
      typeof session["email"] !== "string" ||
      !roles.includes(session["role"] as AppRole)
    ) {
      return null;
    }

    return {
      id: session["id"],
      name: session["name"],
      email: session["email"],
      role: session["role"] as AppRole,
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

export function createCashierAccount(input: NewCashierInput): CashierResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const accounts = loadAccounts();

  if (name.length < 2) return { ok: false, error: "Enter the cashier's full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Use a password of at least 6 characters." };
  }
  if (accounts.some((account) => account.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const account: AuthAccount = {
    id: `acct-cashier-${Date.now().toString(36)}`,
    name,
    email,
    role: "cashier",
    password,
    branchId: input.branchId,
    shift: input.shift.trim() || "09:00 – 18:00",
    createdAt: new Date().toISOString(),
    source: "manager",
  };

  const next = [...accounts, account];
  saveAccounts(next);

  return { ok: true, account, accounts: next };
}
