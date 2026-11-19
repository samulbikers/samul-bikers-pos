import { Navigate, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { canAccessPath, defaultRouteForRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div role="status" className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-border border-t-primary"
        />
        Checking your access…
      </div>
    </div>
  );
}

function AppLayout() {
  const { user, isReady } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (!isReady) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessPath(user.role, pathname)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
