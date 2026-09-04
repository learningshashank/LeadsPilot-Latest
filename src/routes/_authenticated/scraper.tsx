import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Globe, Search, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { runDomainExtract, runSearchGenerate } from "@/lib/scraper.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/scraper")({
  head: () => ({
    meta: [
      { title: "Scraper — LeadsPilot" },
      {
        name: "description",
        content:
          "Run a domain extraction or a filtered persona search, and see the real status and logs for every job.",
      },
      { property: "og:title", content: "Scraper — LeadsPilot" },
      {
        property: "og:description",
        content: "Run domain extraction or persona search jobs and see real job status and logs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScraperPage,
});

type JobRow = {
  id: string;
  job_type: string;
  filters: Record<string, unknown>;
  api_used: string | null;
  status: string;
  result_count: number;
  error_message: string | null;
  log_lines: { at: string; level: "info" | "error"; message: string }[];
  created_at: string;
  completed_at: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-accent text-accent-foreground",
  running: "bg-bg-muted text-muted-foreground",
  queued: "bg-bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

function useScrapeJobs() {
  return useQuery({
    queryKey: ["scrape_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as JobRow[];
    },
    refetchInterval: 4000,
  });
}

function ScraperPage() {
  return (
    <AppShell
      title="Scraper"
      description="Domain extraction and persona search. Every run writes a real job with real logs — nothing here is simulated."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <DomainExtractorCard />
        <SearchGeneratorCard />
      </div>
      <div className="mt-6">
        <JobsPanel />
      </div>
    </AppShell>
  );
}

function DomainExtractorCard() {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function run() {
    if (!domain.trim()) {
      toast.error("Enter a company domain, e.g. stripe.com");
      return;
    }
    setBusy(true);
    try {
      const result = await runDomainExtract({ data: { domain: domain.trim() } });
      qc.invalidateQueries({ queryKey: ["scrape_jobs"] });
      if (result.status === "failed") {
        toast.error(result.errorMessage);
      } else {
        toast.success(`Job completed — ${result.resultCount} result(s).`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Job failed to start.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Globe className="size-4" />
        </span>
        <h2 className="text-base font-bold">Company Website / URL Extractor</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter one company's domain. Sourced via Hunter.io Domain Search when
        HUNTER_API_KEY is configured.
      </p>
      <div className="mt-4 flex gap-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="stripe.com"
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Run"}
        </Button>
      </div>
    </div>
  );
}

function SearchGeneratorCard() {
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [seniority, setSeniority] = useState("");
  const [location, setLocation] = useState("");
  const [provider, setProvider] = useState<"apollo" | "pdl">("apollo");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function run() {
    setBusy(true);
    try {
      const result = await runSearchGenerate({
        data: { title, industry, seniority, location, provider },
      });
      qc.invalidateQueries({ queryKey: ["scrape_jobs"] });
      if (result.status === "failed") {
        toast.error(result.errorMessage);
      } else {
        toast.success(`Job completed — ${result.resultCount} result(s).`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Job failed to start.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "h-9";

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Search className="size-4" />
        </span>
        <h2 className="text-base font-bold">Search &amp; Industry Lead Generator</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Persona/title, industry, seniority and location filters. Choose which
        real discovery provider to query.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. VP Marketing" />
        <Input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" />
        <Input className={inputCls} value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="Seniority" />
        <Input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex rounded-lg border border-border p-0.5">
          {(["apollo", "pdl"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold",
                provider === p ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {p === "apollo" ? "Apollo.io" : "People Data Labs"}
            </button>
          ))}
        </div>
        <Button onClick={run} disabled={busy} className="ml-auto">
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Run search"}
        </Button>
      </div>
    </div>
  );
}

function JobsPanel() {
  const { data, isLoading } = useScrapeJobs();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold">Scraper Tasks &amp; Logs</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Real job history — status, result count and log lines exactly as written by the server.
        </p>
      </div>
      <div className="divide-y divide-border">
        {(data ?? []).map((job) => {
          const open = openId === job.id;
          return (
            <div key={job.id}>
              <button
                className="flex w-full items-center gap-3 px-5 py-3 text-left"
                onClick={() => setOpenId(open ? null : job.id)}
              >
                {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                <span className="text-sm font-medium">
                  {job.job_type === "domain_extract" ? "Domain extract" : "Search generate"} — {(job.filters as any)?.domain || (job.filters as any)?.title || "job"}
                </span>
                <span className="text-xs text-muted-foreground">{job.api_used ?? "no provider"}</span>
                <Badge className={cn("ml-auto border-0", STATUS_STYLES[job.status])}>{job.status}</Badge>
                <span className="text-xs text-muted-foreground">{job.result_count} result(s)</span>
              </button>
              {open ? (
                <div className="rounded-lg bg-foreground px-5 py-4 mx-5 mb-4 font-mono text-xs text-background/90">
                  {job.log_lines.map((l, i) => (
                    <div key={i} className={cn("py-0.5", l.level === "error" && "text-red-400")}>
                      [{new Date(l.at).toLocaleTimeString()}] {l.message}
                    </div>
                  ))}
                  {job.error_message ? (
                    <div className="mt-1 text-red-400">Error: {job.error_message}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {!data?.length ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading…" : "No jobs yet. Run an extractor or search above."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
