import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Radar,
  KanbanSquare,
  Send,
  Settings,
  LogOut,
  Coins,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, useCreditBalance } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/leads", label: "Leads", icon: LayoutGrid },
  { to: "/scraper", label: "Scraper", icon: Radar },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useOrg();
  const { data: credits } = useCreditBalance(data?.org?.id);

  return (
    <div className="flex min-h-screen bg-bg-muted">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background px-4 py-5 md:flex">
        <Link to="/" className="px-2">
          <Logo />
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-border bg-bg-muted p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Coins className="size-3.5" /> Credit balance
            </div>
            <p className="mt-1 text-xl font-bold">{credits ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">
              From credits_ledger. No credits purchased yet.
            </p>
          </div>
          <div className="truncate px-1 text-xs text-muted-foreground">
            {data?.org?.name ?? "No organization"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-background px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
