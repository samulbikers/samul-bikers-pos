export type AppRole = "owner" | "manager" | "cashier";

export const roleLabels: Record<AppRole, string> = {
  owner: "Owner",
  manager: "Store manager",
  cashier: "Cashier",
};

export const roleDescriptions: Record<AppRole, string> = {
  owner: "Full access across the business",
  manager: "Operations, staff and reporting",
  cashier: "Point of sale and personal shift summary",
};

export function isCashier(role: AppRole) {
  return role === "cashier";
}

/**
 * Cashiers only reach the point of sale, their limited dashboard and their own
 * Z report. Every other role keeps the full workspace.
 */
export function canAccessPath(role: AppRole, path: string) {
  if (!isCashier(role)) return true;
  if (path === "/") return true;
  if (path === "/z-report" || path.startsWith("/z-report/")) return true;
  return path === "/pos" || path.startsWith("/pos/");
}

export function defaultRouteForRole(role: AppRole) {
  return isCashier(role) ? "/pos" : "/";
}

export function canManageCashiers(role: AppRole) {
  return role === "owner" || role === "manager";
}

export function canUseGlobalSearch(role: AppRole) {
  return !isCashier(role);
}
