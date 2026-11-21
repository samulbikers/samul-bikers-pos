import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowDown, Check, ShieldCheck } from "lucide-react";

import logo from "@/assets/samul-bikers-logo.png";
import { navigationForRole } from "@/components/layout/nav";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SidebarContents({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();
  const groups = navigationForRole(user?.role);

  return (
    <>
      <Link
        to="/"
        aria-label="Samul Bikers dashboard"
        onClick={onNavigate}
        className="flex min-h-[68px] items-center gap-3 border-b border-sidebar-border px-[19px]"
      >
        <img src={logo} alt="Samul Bikers logo" className="size-10 shrink-0 object-contain" />
        {!collapsed && (
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-sm font-semibold tracking-wide text-sidebar-foreground">
              SAMUL BIKERS
            </span>
            <span className="mt-1 block text-[10px] font-medium text-sidebar-muted">
              BUSINESS MANAGEMENT
            </span>
          </span>
        )}
      </Link>

      <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-5">
        {groups.map((group) => (
          <section key={group.label} className="mb-5">
            {!collapsed && (
              <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-sidebar-muted">
                {group.label}
              </h2>
            )}
            <ul className="space-y-1">
              {group.items.map(({ label, to, icon: Icon, badge }) => {
                const active = isActivePath(pathname, to);

                return (
                  <li key={to}>
                    <Button
                      asChild
                      variant="ghost"
                      title={collapsed ? label : undefined}
                      className={`h-9 w-full justify-start gap-3 rounded-md px-3 text-[13px] font-medium ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      }`}
                    >
                      <Link
                        to={to}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        aria-label={label}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`size-4 shrink-0 ${active ? "text-sidebar-primary" : ""}`}
                        />
                        {!collapsed && (
                          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                        )}
                        {!collapsed && badge && (
                          <span className="flex size-[21px] items-center justify-center rounded-[5px] bg-amber/15 text-[10px] font-semibold text-amber">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <InstallAppButton
            variant="outline"
            className="mb-3 h-8 w-full gap-1.5 text-[10px]"
            label="Install desktop app"
          />
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-medium text-sidebar-foreground">
                Samul Bikers Haven
              </span>
              <span className="mt-0.5 block text-[10px] text-sidebar-muted">Nairobi · Kenya</span>
            </span>
            <Check aria-label="Business location" className="ml-auto size-3.5 shrink-0 text-sidebar-primary" />
          </div>
          <p className="mt-4 border-t border-sidebar-border pt-3 text-[10px] text-sidebar-muted">
            Business Technology. Simplified.
          </p>
        </div>
      )}
    </>
  );
}

export function SidebarCollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="h-[46px] shrink-0 justify-start gap-3 rounded-none border-t border-sidebar-border px-6 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
    >
      <ArrowDown aria-hidden="true" className={`size-4 ${collapsed ? "rotate-90" : "-rotate-90"}`} />
      {!collapsed && <span className="text-[11px]">Collapse sidebar</span>}
    </Button>
  );
}
