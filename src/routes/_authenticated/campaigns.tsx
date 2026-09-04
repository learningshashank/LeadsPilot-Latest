import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — LeadsPilot" },
      {
        name: "description",
        content: "Outreach sequences with stats counted only from logged events.",
      },
      { property: "og:title", content: "Campaigns — LeadsPilot" },
      { property: "og:description", content: "Outreach sequences with real, event-based stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampaignsPage,
});

type Campaign = { id: string; name: string; description: string | null; status: string; created_at: string };
type EventCounts = Record<string, number>;

function CampaignsPage() {
  const qc = useQueryClient();
  const { data: org } = useOrg();
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, description, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["campaign_events", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_events")
        .select("event_type")
        .eq("campaign_id", selected as string);
      if (error) throw error;
      const out: EventCounts = { enrolled: 0, sent: 0, opened: 0, replied: 0, bounced: 0 };
      for (const row of data ?? []) out[row.event_type] = (out[row.event_type] ?? 0) + 1;
      return out;
    },
  });

  async function createCampaign() {
    if (!name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    if (!org?.org?.id) {
      toast.error("No organization found for your account.");
      return;
    }
    const { error } = await supabase
      .from("campaigns")
      .insert({ org_id: org.org.id, name, description, steps: [], status: "draft" });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCreating(false);
    setName("");
    setDescription("");
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    toast.success("Campaign created.");
  }

  return (
    <AppShell
      title="Campaigns"
      description="Sequence builder. Stats reflect logged events only."
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New campaign
        </Button>
      }
    >
      {creating ? (
        <div className="surface-card mb-5 p-5">
          <h2 className="text-sm font-bold">New campaign</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={createCampaign}>Create</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="surface-card p-2">
          {(campaigns ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left",
                selected === c.id ? "bg-accent text-accent-foreground" : "hover:bg-bg-muted",
              )}
            >
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.status}</span>
            </button>
          ))}
          {!campaigns?.length ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No campaigns yet.</p>
          ) : null}
        </div>

        <div className="surface-card p-5">
          {!selected ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Select a campaign to see its stats.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Counts reflect logged events only — not estimates.
              </p>
              <div className="mt-4 grid grid-cols-5 gap-3">
                {(["enrolled", "sent", "opened", "replied", "bounced"] as const).map((key) => (
                  <div key={key} className="rounded-xl border border-border bg-bg-muted p-4 text-center">
                    <p className="text-2xl font-bold">{counts?.[key] ?? 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
