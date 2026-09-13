import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Wallet, ShieldCheck, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg, useCreditBalance } from "@/hooks/use-session";
import { getApiKeyStatus } from "@/lib/scraper.functions";
import { getRazorpayKeyId, createRazorpayOrder, verifyAndCreditPayment } from "@/lib/razorpay.functions";
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

const TOPUP_PRESETS = [1000, 2000, 5000, 10000, 25000, 50000];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BillingTab() {
  const qc = useQueryClient();
  const { data: org } = useOrg();
  const { data: balance } = useCreditBalance(org?.org?.id);
  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = selected ?? (customAmount ? parseInt(customAmount, 10) : 0);

  async function handleAddFunds() {
    if (!amount || amount < 1000) {
      toast.error("Minimum top-up is ₹1,000.");
      return;
    }
    setBusy(true);
    try {
      const [{ keyId }, order] = await Promise.all([
        getRazorpayKeyId(),
        createRazorpayOrder({ data: { amountInr: amount } }),
      ]);
      if (!keyId) {
        toast.error("Razorpay is not configured yet. Add RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in your hosting environment variables.");
        setBusy(false);
        return;
      }
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load Razorpay checkout. Check your connection and try again.");
        setBusy(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "LeadsPilot",
        description: "Wallet top-up",
        theme: { color: "#F5A623" },
        handler: async (response: any) => {
          try {
            const result = await verifyAndCreditPayment({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            toast.success(`₹${result.creditedAmount.toLocaleString("en-IN")} added. New balance: ₹${result.newBalance.toLocaleString("en-IN")}.`);
            qc.invalidateQueries({ queryKey: ["credits"] });
            setSelected(null);
            setCustomAmount("");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment verification failed.");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Could not start payment.");
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Wallet className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold">Add Funds</h2>
          <p className="text-xs text-muted-foreground">
            Current balance: ₹{(balance ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {TOPUP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setSelected(preset);
              setCustomAmount("");
            }}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
              selected === preset
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-foreground hover:border-accent",
            )}
          >
            ₹{preset.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">or enter custom amount</p>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border px-3">
        <span className="text-sm text-muted-foreground">₹</span>
        <input
          type="number"
          min={1000}
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelected(null);
          }}
          placeholder="Enter amount (min ₹1,000)"
          className="h-11 w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Button
        onClick={handleAddFunds}
        disabled={busy || !amount || amount < 1000}
        className="mt-4 w-full gap-2"
        size="lg"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Add Money Securely
      </Button>
      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3" /> Secured by Razorpay — zero fees on top-ups
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
