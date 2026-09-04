import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-session";
import { getApiKeyStatus } from "@/lib/scraper.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LeadsPilot" },
      { name: "description", content: "Org profile, team, billing and API key status." },
      { property: "og:title", content: "Settings — LeadsPilot" },
      { property: "og:description", content: "Org profile, team, billing and API key status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const TABS = ["Org Profile", "Team", "Billing", "API Keys"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Org Profile");

  return (
    <AppShell title="Settings">
      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-5 max-w-2xl">
        {tab === "Org Profile" ? <OrgProfileTab /> : null}
        {tab === "Team" ? <TeamTab /> : null}
        {tab === "Billing" ? <BillingTab /> : null}
        {tab === "API Keys" ? <ApiKeysTab /> : null}
      </div>
    </AppShell>
  );
}

function OrgProfileTab() {
  const qc = useQueryClient();
  const { data } = useOrg();
  const [name, setName] = useState(data?.org?.name ?? "");
  const [industry, setIndustry] = useState(data?.org?.target_industry ?? "");
  const [geo, setGeo] = useState(data?.org?.target_geography ?? "");
  const [size, setSize] = useState(data?.org?.company_size_range ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!data?.org?.id) {
      toast.error("No organization found for your account.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        target_industry: industry || null,
        target_geography: geo || null,
        company_size_range: size || null,
      })
      .eq("id", data.org.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Org profile saved.");
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Company name</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-industry">Target industry</Label>
        <Input id="org-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-size">Company size range</Label>
        <Input id="org-size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 51-200" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="org-geo">Target geography</Label>
        <Input id="org-geo" value={geo} onChange={(e) => setGeo(e.target.value)} />
      </div>
      <Button onClick={save} disabled={busy}>
        Save changes
      </Button>
    </div>
  );
}

function TeamTab() {
  const { data: org } = useOrg();
  const { data: members, isLoading } = useQuery({
    queryKey: ["team_members", org?.org?.id],
    enabled: !!org?.org?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, created_at")
        .eq("org_id", org!.org!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="surface-card divide-y divide-border">
      {(members ?? []).map((m) => (
        <div key={m.id} className="flex items-center justify-between px-5 py-3">
          <div>
            <p className="text-sm font-medium">{m.full_name || m.email}</p>
            <p className="text-xs text-muted-foreground">{m.email}</p>
          </div>
          <Badge className="border-0 bg-bg-muted text-muted-foreground capitalize">{m.role}</Badge>
        </div>
      ))}
      {!members?.length ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading…" : "No team members found."}
        </p>
      ) : null}
    </div>
  );
}

function BillingTab() {
  return (
    <div className="surface-card p-5">
      <h2 className="text-sm font-bold">Billing</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Razorpay subscription billing is not wired up yet. Your workspace is on the
        free plan by default (see the <code>subscriptions</code> table). This tab
        will show plan, renewal date and invoice history once billing is connected.
      </p>
    </div>
  );
}

function ApiKeysTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["api_key_status"],
    queryFn: () => getApiKeyStatus(),
  });

  return (
    <div className="surface-card divide-y divide-border">
      <div className="px-5 py-4">
        <h2 className="text-sm font-bold">Data provider API keys</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Status only — keys themselves are set as environment variables on
          your hosting platform, not editable on this page.
        </p>
      </div>
      {(data ?? []).map((k) => (
        <div key={k.name} className="flex items-center justify-between px-5 py-3">
          <span className="font-mono text-sm">{k.name}</span>
          {k.configured ? (
            <Badge className="gap-1 border-0 bg-accent text-accent-foreground">
              <Check className="size-3" /> Configured
            </Badge>
          ) : (
            <Badge className="gap-1 border-0 bg-bg-muted text-muted-foreground">
              <X className="size-3" /> Not configured
            </Badge>
          )}
        </div>
      ))}
      {isLoading ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">Checking…</p>
      ) : null}
    </div>
  );
}
