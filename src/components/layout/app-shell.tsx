import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { SidebarCollapseButton, SidebarContents } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { flatNavItems } from "@/components/layout/nav";

const SIDEBAR_KEY = "samul-sidebar-collapsed";

function useActiveNavItem() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const sorted = [...flatNavItems].sort((a, b) => b.to.length - a.to.length);

  return (
    sorted.find((item) =>
      item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`),
    ) ?? flatNavItems[0]!
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const active = useActiveNavItem();

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  return (
    <div id="app" className="dashboard-shell flex min-h-screen w-full bg-background text-foreground">
      <aside
        className={`dashboard-sidebar sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px]" : "w-[238px]"
        }`}
      >
        <SidebarContents collapsed={collapsed} />
        <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar title={active.label} description={active.description} />

        <main className="dashboard-main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 pb-8 pt-5 sm:gap-[22px] sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pt-7">
          {children}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
            <span>Samul Bikers POS · Business Technology. Simplified.</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Illustrative figures only · Preview workspace
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
