import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus, ArrowUpDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads dashboard — LeadsPilot" },
      {
        name: "description",
        content:
          "Filter, sort and export your sourced B2B leads. Every row shows its provider and real verification status.",
      },
      { property: "og:title", content: "Leads dashboard — LeadsPilot" },
      {
        property: "og:description",
        content: "Filter, sort and export sourced B2B leads with provider and verification data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});

const NA = <span className="text-muted-foreground/70 italic">Not available</span>;

const VERIFICATION_STYLES: Record<string, string> = {
  verified: "bg-accent text-accent-foreground",
  catch_all: "bg-bg-muted text-muted-foreground",
  unverified: "bg-bg-muted text-muted-foreground",
  invalid: "bg-destructive/10 text-destructive",
  not_checked: "bg-bg-muted text-muted-foreground",
};

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  seniority: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  location: string | null;
  source: string;
  verification_status: string;
  verification_source: string | null;
  lead_score: number | null;
  pipeline_stage: string;
  created_at: string;
  companies: { name: string | null; industry: string | null; domain: string | null } | null;
};

function LeadsPage() {
  const { data: orgData } = useOrg();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [seniority, setSeniority] = useState("");
  const [verification, setVerification] = useState("");
  const [stage, setStage] = useState("");
  const [activeList, setActiveList] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);

  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, first_name, last_name, title, seniority, email, phone, linkedin_url, location, source, verification_status, verification_source, lead_score, pipeline_stage, created_at, companies(name, industry, domain)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadRow[];
    },
  });

  const listsQuery = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("id, name, color, list_leads(lead_id)")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const listIds = activeList
      ? new Set(
          (listsQuery.data ?? [])
            .filter((l: any) => l.id === activeList)
            .flatMap((l: any) => l.list_leads.map((x: any) => x.lead_id)),
        )
      : null;
    const out = (leadsQuery.data ?? []).filter((l) => {
      if (listIds && !listIds.has(l.id)) return false;
      if (industry && l.companies?.industry !== industry) return false;
      if (seniority && l.seniority !== seniority) return false;
      if (verification && l.verification_status !== verification) return false;
      if (stage && l.pipeline_stage !== stage) return false;
      if (search) {
        const hay = [l.first_name, l.last_name, l.email, l.title, l.companies?.name]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    return out.sort((a, b) => {
      const av = a.lead_score ?? -1;
      const bv = b.lead_score ?? -1;
      return sortDesc ? bv - av : av - bv;
    });
  }, [leadsQuery.data, listsQuery.data, activeList, industry, seniority, verification, stage, search, sortDesc]);

  const industries = useMemo(
    () =>
      Array.from(
        new Set((leadsQuery.data ?? []).map((l) => l.companies?.industry).filter(Boolean)),
      ) as string[],
    [leadsQuery.data],
  );
  const seniorities = useMemo(
    () => Array.from(new Set((leadsQuery.data ?? []).map((l) => l.seniority).filter(Boolean))) as string[],
    [leadsQuery.data],
  );

  function exportCsv() {
    const headers = [
      "first_name","last_name","title","seniority","company","domain","industry","email","phone","linkedin_url","location","source","verification_status","verification_source","lead_score","pipeline_stage","created_at",
    ];
    const escape = (v: unknown) =>
      v === null || v === undefined || v === "" ? "" : `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((l) =>
        [
          l.first_name,l.last_name,l.title,l.seniority,l.companies?.name,l.companies?.domain,l.companies?.industry,l.email,l.phone,l.linkedin_url,l.location,l.source,l.verification_status,l.verification_source,l.lead_score,l.pipeline_stage,l.created_at,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadspilot-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground";

  return (
    <AppShell
      title="Leads"
      description={
        orgData?.org?.target_industry
          ? `Default filters: ${orgData.org.target_industry}${orgData.org.target_geography ? ` · ${orgData.org.target_geography}` : ""}`
          : "All contacts sourced into your workspace."
      }
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="size-4" /> Export CSV
        </Button>
      }
    >
      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="surface-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Lists</h2>
              <Plus className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => setActiveList(null)}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left text-sm",
                  !activeList ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                All leads ({leadsQuery.data?.length ?? 0})
              </button>
              {(listsQuery.data ?? []).map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => setActiveList(l.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                    activeList === l.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.name} ({l.list_leads.length})
                </button>
              ))}
              {!listsQuery.data?.length ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  No saved lists yet.
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company"
              className="h-9 w-56"
            />
            <select className={selectCls} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">All industries</option>
              {industries.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <select className={selectCls} value={seniority} onChange={(e) => setSeniority(e.target.value)}>
              <option value="">All seniority</option>
              {seniorities.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <select className={selectCls} value={verification} onChange={(e) => setVerification(e.target.value)}>
              <option value="">Any verification</option>
              {["verified", "unverified", "catch_all", "invalid", "not_checked"].map((v) => (
                <option key={v} value={v}>
                  {v.replace("_", " ")}
                </option>
              ))}
            </select>
            <select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">Any stage</option>
              {["new","contacted","meeting_scheduled","qualified","in_negotiation","closed_won"].map((v) => (
                <option key={v} value={v}>
                  {v.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="surface-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border bg-bg-muted text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Verification</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th
                    className="cursor-pointer px-4 py-3 font-semibold"
                    onClick={() => setSortDesc((v) => !v)}
                  >
                    <span className="inline-flex items-center gap-1">
                      Score <ArrowUpDown className="size-3" />
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {[l.first_name, l.last_name].filter(Boolean).join(" ") || NA}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.title || NA}</td>
                    <td className="px-4 py-3">{l.companies?.name || NA}</td>
                    <td className="px-4 py-3">{l.email || NA}</td>
                    <td className="px-4 py-3">{l.phone || NA}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "border-0 font-medium",
                          VERIFICATION_STYLES[l.verification_status],
                        )}
                      >
                        {l.verification_status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.source}</td>
                    <td className="px-4 py-3">{l.lead_score ?? NA}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.pipeline_stage.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium">No leads yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {leadsQuery.isLoading
                    ? "Loading…"
                    : "Nothing has been sourced into this workspace. Run a job from the Scraper page once your provider keys are connected."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
