import { describe, expect, it } from "vitest";

import { navigationForRole } from "@/components/layout/nav";
import { toAccount } from "@/lib/auth/accounts";
import { canAccessPath, canManageCashiers, defaultRouteForRole } from "@/lib/auth/roles";
import type { DbStaffAccount } from "@/lib/supabase/types";

describe("Role based access", () => {
  it("limits cashiers to the dashboard, point of sale and their Z report", () => {
    expect(canAccessPath("cashier", "/")).toBe(true);
    expect(canAccessPath("cashier", "/pos")).toBe(true);
    expect(canAccessPath("cashier", "/pos/receipt/1")).toBe(true);
    expect(canAccessPath("cashier", "/z-report")).toBe(true);
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

    expect(paths).toEqual(["/", "/pos", "/z-report"]);
    expect(groups.map((group) => group.label)).toEqual(["Workspace"]);
  });

  it("maps Supabase staff rows to app accounts", () => {
    const row: DbStaffAccount = {
      id: "acct-1",
      name: "Mary Wanjiku",
      username: "mary",
      role: "cashier",
      branch_id: "br-02",
      shift: "09:00 – 18:00",
      source: "manager",
      created_at: "2026-11-21T10:00:00.000Z",
    };

    expect(toAccount(row)).toEqual({
      id: "acct-1",
      name: "Mary Wanjiku",
      username: "mary",
      role: "cashier",
      branchId: "br-02",
      shift: "09:00 – 18:00",
      createdAt: "2026-11-21T10:00:00.000Z",
      source: "manager",
    });
  });

  it("lets owners and managers manage staff accounts", () => {
    expect(canManageCashiers("owner")).toBe(true);
    expect(canManageCashiers("manager")).toBe(true);
    expect(canManageCashiers("cashier")).toBe(false);
  });
});
