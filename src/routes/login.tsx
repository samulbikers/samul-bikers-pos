import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, ShoppingCart } from "lucide-react";
import { useState } from "react";

import logo from "@/assets/samul-bikers-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoAccounts } from "@/lib/auth/accounts";
import { useAuth } from "@/lib/auth/auth-context";
import { defaultRouteForRole } from "@/lib/auth/roles";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Samul Bikers POS" },
      { name: "description", content: "Sign in to the Samul Bikers point of sale." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isReady, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isReady && user) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError("");
    void navigate({ to: defaultRouteForRole(result.user.role), replace: true });
  };

  const useDemo = (demo: (typeof demoAccounts)[number]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
      <section className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Samul Bikers logo" className="size-10 object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold tracking-wide">SAMUL BIKERS</span>
            <span className="mt-1 block text-[10px] text-sidebar-muted">BUSINESS MANAGEMENT</span>
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-[32px] font-semibold leading-tight">
            One workspace.
            <br />
            The right access for every role.
          </h1>
          <p className="mt-4 text-[13px] leading-relaxed text-sidebar-muted">
            Store managers run the shop. Cashiers get the point of sale and their own shift summary — nothing else.
          </p>
          <ul className="mt-8 space-y-3 text-[12px] text-sidebar-muted">
            <li className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-sidebar-primary" />
              Role-based navigation and route guards
            </li>
            <li className="flex items-center gap-2">
              <ShoppingCart aria-hidden="true" className="size-4 text-sidebar-primary" />
              Cashier access limited to the till
            </li>
          </ul>
        </div>

        <p className="text-[10px] text-sidebar-muted">Business Technology. Simplified.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[390px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="Samul Bikers logo" className="size-10 object-contain" />
            <span className="font-display text-sm font-semibold tracking-wide text-foreground">SAMUL BIKERS</span>
          </div>

          <h2 className="font-display text-[24px] font-semibold leading-tight text-foreground">Sign in</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Use your store account. Cashiers added by a manager sign in with the email and password they were given.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-[11px]">
                Email
              </Label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@samulbikers.co.ke"
                  className="h-10 pl-9 text-[12px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-[11px]">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="h-10 pl-9 text-[12px]"
                  required
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="h-10 w-full gap-2 text-[12px]">
              Sign in
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </form>

          <div className="mt-7 rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Preview accounts
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {demoAccounts.map((demo) => (
                <Button
                  key={demo.email}
                  type="button"
                  variant="outline"
                  onClick={() => useDemo(demo)}
                  className="h-9 text-[11px]"
                >
                  {demo.label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              Credentials are stored in this browser for the preview. Choose a demo role, then sign in.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
