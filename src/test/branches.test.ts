import { describe, expect, it } from "vitest";

import { toBranch } from "@/lib/branches/branch-store";
import type { DbBranch } from "@/lib/supabase/types";

describe("Branch mapping", () => {
  it("maps Supabase branch rows to the app branch shape", () => {
    const row: DbBranch = {
      id: "br-02",
      name: "Ngara workshop",
      city: "Nairobi",
      address: "Park Road, Unit 6",
      phone: "+254 733 400 280",
      manager: "Esther Njoki",
      status: "Open",
      staff: 2,
      monthly_revenue: 486300,
      stock_value: 1120000,
      created_at: "2026-11-21T10:00:00.000Z",
      updated_at: "2026-11-21T10:00:00.000Z",
    };

    expect(toBranch(row)).toEqual({
      id: "br-02",
      name: "Ngara workshop",
      city: "Nairobi",
      address: "Park Road, Unit 6",
      phone: "+254 733 400 280",
      manager: "Esther Njoki",
      status: "Open",
      staff: 2,
      monthlyRevenue: 486300,
      stockValue: 1120000,
    });
  });
});
