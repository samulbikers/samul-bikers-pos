import { AlertTriangle, Loader2, PlugZap } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/supabase/client";

export function QueryError({ error, label }: { error: unknown; label: string }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[11px] text-foreground"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-0.5 block text-muted-foreground">{message}</span>
      </span>
    </div>
  );
}

export function QueryLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-[11px] text-muted-foreground"
    >
      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      {label}
    </div>
  );
}

export function SupabaseNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-[11px] text-foreground"
    >
      <PlugZap aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber" />
      <span>
        <span className="block font-medium">Database not connected</span>
        <span className="mt-0.5 block text-muted-foreground">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the dev server.
        </span>
      </span>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-10 text-center">
      <p className="text-[12px] font-medium text-card-foreground">{title}</p>
      <p className="max-w-sm text-[10px] leading-[1.6] text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
