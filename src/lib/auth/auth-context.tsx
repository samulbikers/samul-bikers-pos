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
  createCashierAccount,
  loadAccounts,
  loadSession,
  saveSession,
  type AuthAccount,
  type AuthSession,
  type NewCashierInput,
} from "./accounts";

type SignInResult = { ok: true; user: AuthSession } | { ok: false; error: string };

type AddCashierResult =
  | { ok: true; account: AuthAccount; accounts: AuthAccount[] }
  | { ok: false; error: string };

type AuthContextValue = {
  user: AuthSession | null;
  accounts: AuthAccount[];
  isReady: boolean;
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  addCashier: (input: NewCashierInput) => AddCashierResult;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAccounts(loadAccounts());
    setUser(loadSession());
    setIsReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string): SignInResult => {
    const account = authenticate(email, password);
    if (!account) {
      return { ok: false, error: "Email or password is incorrect." };
    }

    saveSession(account);
    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    };
    setUser(session);
    setAccounts((current) => (current.length ? current : loadAccounts()));
    return { ok: true, user: session };
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const addCashier = useCallback((input: NewCashierInput): AddCashierResult => {
    const result = createCashierAccount(input);
    if (!result.ok) return result;

    setAccounts(result.accounts);
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, accounts, isReady, signIn, signOut, addCashier }),
    [user, accounts, isReady, signIn, signOut, addCashier],
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
