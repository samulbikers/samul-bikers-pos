import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  authenticate,
  clearSession,
  createStaffAccount,
  deleteStaffAccount,
  loadAccounts,
  loadSession,
  resetAccountPin,
  saveSession,
  updateStaffAccount,
  type AuthAccount,
  type AuthSession,
  type NewStaffInput,
  type UpdateStaffInput,
} from "./accounts";

type SignInResult = { ok: true; user: AuthSession } | { ok: false; error: string };

type AccountResult =
  | { ok: true; account: AuthAccount }
  | { ok: false; error: string };

type AuthContextValue = {
  user: AuthSession | null;
  accounts: AuthAccount[];
  isReady: boolean;
  signIn: (username: string, pin: string) => Promise<SignInResult>;
  signOut: () => void;
  addStaff: (input: NewStaffInput) => Promise<AccountResult>;
  updateStaff: (accountId: string, input: UpdateStaffInput) => Promise<AccountResult>;
  deleteStaff: (accountId: string) => Promise<AccountResult>;
  resetPin: (accountId: string, pin: string) => Promise<AccountResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refreshAccounts = useCallback(async () => {
    try {
      setAccounts(await loadAccounts());
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshAccounts();
      setUser(loadSession());
      setIsReady(true);
    })();
  }, [refreshAccounts]);

  const signIn = useCallback(async (username: string, pin: string): Promise<SignInResult> => {
    try {
      const account = await authenticate(username, pin);
      if (!account) {
        return { ok: false, error: "Username or PIN is incorrect." };
      }

      saveSession(account);
      const session = {
        id: account.id,
        name: account.name,
        username: account.username,
        role: account.role,
        branchId: account.branchId,
      };
      setUser(session);
      return { ok: true, user: session };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Could not reach Supabase.",
      };
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const addStaff = useCallback(
    async (input: NewStaffInput): Promise<AccountResult> => {
      const result = await createStaffAccount(input);
      if (result.ok) await refreshAccounts();
      return result;
    },
    [refreshAccounts],
  );

  const updateStaff = useCallback(
    async (accountId: string, input: UpdateStaffInput): Promise<AccountResult> => {
      const result = await updateStaffAccount(accountId, input);
      if (result.ok) await refreshAccounts();
      return result;
    },
    [refreshAccounts],
  );

  const deleteStaff = useCallback(
    async (accountId: string): Promise<AccountResult> => {
      const result = await deleteStaffAccount(accountId);
      if (result.ok) await refreshAccounts();
      return result;
    },
    [refreshAccounts],
  );

  const resetPin = useCallback(
    async (accountId: string, pin: string): Promise<AccountResult> => {
      const result = await resetAccountPin(accountId, pin);
      if (result.ok) await refreshAccounts();
      return result;
    },
    [refreshAccounts],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, accounts, isReady, signIn, signOut, addStaff, updateStaff, deleteStaff, resetPin }),
    [user, accounts, isReady, signIn, signOut, addStaff, updateStaff, deleteStaff, resetPin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
