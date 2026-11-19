import { beforeEach, describe, expect, it } from "vitest";

import { navigationForRole } from "@/components/layout/nav";
import { authenticate, createCashierAccount, loadAccounts } from "@/lib/auth/accounts";
import { canAccessPath, canManageCashiers, defaultRouteForRole } from "@/lib/auth/roles";

describe("Role based access", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("limits cashiers to the dashboard and point of sale", () => {
    expect(canAccessPath("cashier", "/")).toBe(true);
    expect(canAccessPath("cashier", "/pos")).toBe(true);
    expect(canAccessPath("cashier", "/pos/receipt/1")).toBe(true);
    expect(canAccessPath("cashier", "/sales")).toBe(false);
    expect(canAccessPath("cashier", "/staff")).toBe(false);
    expect(canAccessPath("cashier", "/settings")).toBe(false);
    expect(defaultRouteForRole("cashier")).toBe("/pos");
  });

  it("keeps the full workspace for managers and owners", () => {
    for (const role of ["manager", "owner"] as const) {
      expect(canAccessPath(role, "/sales")).toBe(true);
      expect(canAccessPath(role, "/staff")).toBe(true);
      expect(canAccessPath(role, "/settings")).toBe(true);
    }
  });

  it("only shows cashiers their permitted navigation", () => {
    const groups = navigationForRole("cashier");
    const paths = groups.flatMap((group) => group.items.map((item) => item.to));

    expect(paths).toEqual(["/", "/pos"]);
    expect(groups.map((group) => group.label)).toEqual(["Workspace"]);
  });

  it("lets managers create a cashier who can sign in", () => {
    expect(canManageCashiers("manager")).toBe(true);

    const result = createCashierAccount({
      name: "Mary Wanjiku",
      email: "mary@samulbikers.co.ke",
      password: "till2026",
      branchId: "br-01",
      shift: "09:00 – 18:00",
    });

    expect(result.ok).toBe(true);
    const signedIn = authenticate("mary@samulbikers.co.ke", "till2026");
    expect(signedIn?.role).toBe("cashier");
    expect(signedIn?.name).toBe("Mary Wanjiku");
    expect(loadAccounts().some((account) => account.email === "mary@samulbikers.co.ke")).toBe(true);
  });

  it("rejects duplicate emails and weak passwords", () => {
    const duplicate = createCashierAccount({
      name: "Another Lucy",
      email: "lucy@samulbikers.co.ke",
      password: "till2026",
      branchId: "br-01",
      shift: "09:00 – 18:00",
    });
    expect(duplicate).toEqual({ ok: false, error: "An account with that email already exists." });

    const weak = createCashierAccount({
      name: "New Cashier",
      email: "new@samulbikers.co.ke",
      password: "123",
      branchId: "br-01",
      shift: "09:00 – 18:00",
    });
    expect(weak.ok).toBe(false);
  });
});
