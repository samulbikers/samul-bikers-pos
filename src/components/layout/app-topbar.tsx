import { Activity, Bell, Boxes, ChevronDown, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { GlobalSearch } from "@/components/layout/global-search";
import { SidebarContents } from "@/components/layout/app-sidebar";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { canUseGlobalSearch, roleLabels } from "@/lib/auth/roles";
import { formatNairobiDate, initialsOf } from "@/lib/format";

export function AppTopbar({ title, description }: { title: string; description: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [date, setDate] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    void navigate({ to: "/login", replace: true });
  };

  useEffect(() => {
    const update = () => setDate(formatNairobiDate(new Date()));
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="dashboard-topbar sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="-ml-2 shrink-0 text-foreground lg:hidden"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-label="Main navigation"
            className="flex h-dvh w-[min(320px,88vw)] max-w-none flex-col gap-0 overflow-hidden border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:w-80"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Samul Bikers POS navigation</SheetTitle>
              <SheetDescription>Business management menu</SheetDescription>
            </SheetHeader>
            <SidebarContents collapsed={false} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-[16px] font-semibold text-foreground sm:text-[17px]">
              {title}
            </h1>
            <span className="hidden h-5 items-center rounded border border-border px-1.5 text-[9px] font-medium text-muted-foreground sm:inline-flex">
              Preview
            </span>
          </div>
          <p className="hidden truncate text-[10px] text-muted-foreground sm:block">{description}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {user && canUseGlobalSearch(user.role) && <GlobalSearch />}

        <span className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-[10px] text-muted-foreground xl:inline-flex">
          <Activity aria-hidden="true" className="size-3.5 text-emerald" />
          Nairobi{date && ` · ${date}`}
        </span>

        <InstallAppButton
          variant="ghost"
          className="hidden h-9 gap-1.5 px-2 text-[11px] font-medium sm:inline-flex"
          label="Install"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="size-9 shrink-0 text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Preview notifications"
              aria-label="Preview notifications"
              className="relative size-9 shrink-0 text-muted-foreground"
            >
              <Bell className="size-4" />
              <span aria-hidden="true" className="absolute right-[7px] top-[7px] size-[7px] rounded-full border-[1.5px] border-background bg-amber" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(370px,92vw)] sm:w-[390px]">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>Preview alerts · Sample data</SheetDescription>
            </SheetHeader>
            <ul className="mt-6 divide-y divide-border">
              <li className="flex gap-3 py-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber/10 text-amber">
                  <Boxes aria-hidden="true" className="size-4" />
                </span>
                <span>
                  <span className="block text-[12px] font-medium text-foreground">3 products need attention</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Check availability before placing an order.
                  </span>
                </span>
              </li>
              <li className="flex gap-3 py-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Activity aria-hidden="true" className="size-4" />
                </span>
                <span>
                  <span className="block text-[12px] font-medium text-foreground">Sample trading activity ready</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Illustrative only — no real transactions recorded.
                  </span>
                </span>
              </li>
            </ul>
          </SheetContent>
        </Sheet>

        <span className="mx-1 hidden h-7 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-2 px-1.5 text-left hover:bg-accent"
              aria-label="Account menu"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[10px] font-semibold text-primary">
                {user ? initialsOf(user.name) : "—"}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-[11px] font-medium text-foreground">
                  {user?.name ?? "Signed out"}
                </span>
                <span className="mt-0.5 block text-[9px] text-muted-foreground">
                  {user ? roleLabels[user.role] : "Preview workspace"}
                </span>
              </span>
              <ChevronDown aria-hidden="true" className="hidden size-3 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block">{user?.name ?? "Signed out"}</span>
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                {user ? roleLabels[user.role] : ""}
                {user ? ` · @${user.username}` : ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserRound aria-hidden="true" className="mr-2 size-4" />
              Profile
              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">Preview</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === "dark" ? <Sun aria-hidden="true" className="mr-2 size-4" /> : <Moon aria-hidden="true" className="mr-2 size-4" />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut aria-hidden="true" className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
