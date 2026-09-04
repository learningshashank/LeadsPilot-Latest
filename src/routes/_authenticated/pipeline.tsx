import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — LeadsPilot" },
      {
        name: "description",
        content: "Drag leads across a six-stage pipeline from new to closed won.",
      },
      { property: "og:title", content: "Pipeline — LeadsPilot" },
      { property: "og:description", content: "Drag leads across a six-stage sales pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});

type PipelineStage = "new" | "contacted" | "meeting_scheduled" | "qualified" | "in_negotiation" | "closed_won";

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "meeting_scheduled", label: "Meeting Scheduled" },
  { key: "qualified", label: "Qualified" },
  { key: "in_negotiation", label: "In Negotiation" },
  { key: "closed_won", label: "Closed Won" },
];

type CardLead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  lead_score: number | null;
  pipeline_stage: PipelineStage;
  companies: { name: string | null } | null;
};

function PipelinePage() {
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pipeline_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, first_name, last_name, lead_score, pipeline_stage, companies(name)")
        .order("lead_score", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as CardLead[];
    },
  });

  async function moveTo(id: string, stage: PipelineStage) {
    qc.setQueryData<CardLead[]>(["pipeline_leads"], (prev) =>
      (prev ?? []).map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)),
    );
    const { error } = await supabase.from("leads").update({ pipeline_stage: stage }).eq("id", id);
    if (error) qc.invalidateQueries({ queryKey: ["pipeline_leads"] });
  }

  return (
    <AppShell title="Pipeline" description="Drag a card to move it between stages.">
      <div className="grid grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const cards = (data ?? []).filter((l) => l.pipeline_stage === stage.key);
          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveTo(dragId, stage.key);
                setDragId(null);
              }}
              className="min-h-[60vh] rounded-xl border border-border bg-bg-muted p-2"
            >
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {stage.label}
                </h3>
                <span className="text-xs text-muted-foreground">{cards.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDragId(card.id)}
                    className="cursor-grab rounded-lg border border-border bg-background p-3 text-sm shadow-sm active:cursor-grabbing"
                  >
                    <p className="font-medium">
                      {[card.first_name, card.last_name].filter(Boolean).join(" ") || "Unnamed lead"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {card.companies?.name ?? "Not available"}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        "bg-accent text-accent-foreground",
                      )}
                    >
                      Score {card.lead_score ?? "—"}
                    </span>
                  </div>
                ))}
                {!cards.length && !isLoading ? (
                  <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
