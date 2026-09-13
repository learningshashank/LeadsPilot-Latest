import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Real scrape endpoints — Hunter.io (domain search), Apollo.io (people
 * search), and People Data Labs (person search).
 *
 * DATA HONESTY RULE, enforced throughout this file:
 * - A lead/company row is only ever inserted from a field the provider
 *   actually returned. Missing fields stay NULL — never filled with a
 *   plausible-looking placeholder (no invented phone numbers, no guessed
 *   LinkedIn URLs, no default company size/revenue).
 * - `verification_status` is only ever "verified" when the provider's own
 *   response says so; otherwise it's "unverified" or "not_checked".
 * - If a credential is missing or a provider call fails, the job is marked
 *   "failed" with the real error message — nothing is fabricated to make a
 *   run look successful.
 */

type LogLine = { at: string; level: "info" | "error"; message: string };
type JobResult = { jobId: string; status: "completed" | "failed"; resultCount: number; errorMessage?: string };

const now = () => new Date().toISOString();

async function orgIdFor(supabase: any, userId: string) {
  const { data, error } = await supabase.from("users").select("org_id").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.org_id) throw new Error("No organization for this user.");
  return data.org_id as string;
}

async function createJob(supabase: any, orgId: string, jobType: string, filters: Record<string, unknown>, apiUsed: string) {
  const logs: LogLine[] = [
    { at: now(), level: "info", message: `Job accepted (${jobType}).` },
    { at: now(), level: "info", message: `Filters: ${JSON.stringify(filters)}` },
  ];
  const { data: job, error } = await supabase
    .from("scrape_jobs")
    .insert({ org_id: orgId, job_type: jobType, filters, api_used: apiUsed, status: "running", result_count: 0, log_lines: logs })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { jobId: job.id as string, logs };
}

async function finishJob(
  supabase: any,
  jobId: string,
  logs: LogLine[],
  outcome: { status: "completed" | "failed"; resultCount: number; errorMessage?: string },
) {
  await supabase
    .from("scrape_jobs")
    .update({ status: outcome.status, result_count: outcome.resultCount, error_message: outcome.errorMessage ?? null, log_lines: logs, completed_at: now() })
    .eq("id", jobId);
  return { jobId, ...outcome };
}

// ---------------------------------------------------------------------------
// Hunter.io — Domain Search (real, single-company lookup)
// Docs: https://hunter.io/api-documentation/v2#domain-search
// ---------------------------------------------------------------------------
function mapHunterVerification(status: string | null | undefined): "verified" | "catch_all" | "invalid" | "unverified" {
  switch ((status || "").toLowerCase()) {
    case "valid":
      return "verified";
    case "accept_all":
      return "catch_all";
    case "invalid":
    case "disposable":
      return "invalid";
    default:
      return "unverified";
  }
}

async function runHunterDomainExtract(supabase: any, orgId: string, domain: string): Promise<JobResult> {
  const { jobId, logs } = await createJob(supabase, orgId, "domain_extract", { domain }, "hunter.io");
  const apiKey = process.env["HUNTER_API_KEY"];

  if (!apiKey) {
    logs.push({ at: now(), level: "error", message: "HUNTER_API_KEY is not configured. Add it in Settings → API keys." });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: "HUNTER_API_KEY is missing." });
  }

  try {
    logs.push({ at: now(), level: "info", message: `Querying Hunter.io Domain Search for ${domain}...` });
    const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=20`);
    const json: any = await res.json();

    if (!res.ok) {
      const msg = json?.errors?.[0]?.details || json?.errors?.[0]?.id || `Hunter API error (${res.status})`;
      logs.push({ at: now(), level: "error", message: msg });
      return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: msg });
    }

    const d = json.data;
    if (!d) {
      logs.push({ at: now(), level: "error", message: "Hunter returned no data for this domain." });
      return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: "No data returned." });
    }

    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({
        org_id: orgId,
        name: d.organization || domain,
        domain,
        industry: d.industry || null,
        employee_count: typeof d.headcount === "number" ? d.headcount : null,
        headquarters: [d.city, d.state, d.country].filter(Boolean).join(", ") || null,
        tech_stack: d.technologies ?? null,
        source: "hunter_domain",
      })
      .select("id")
      .single();
    if (companyErr) throw new Error(companyErr.message);

    const people = (d.emails || []) as any[];
    let inserted = 0;
    for (const p of people) {
      const { error: leadErr } = await supabase.from("leads").insert({
        org_id: orgId,
        company_id: company.id,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        title: p.position || null,
        seniority: p.seniority || null,
        department: p.department || null,
        email: p.value || null,
        phone: p.phone_number || null, // null unless Hunter actually returned one
        linkedin_url: p.linkedin || null, // null unless Hunter actually returned one
        location: [d.city, d.country].filter(Boolean).join(", ") || null,
        source: "hunter_domain",
        verification_status: mapHunterVerification(p.verification?.status),
        verification_source: "hunter.io",
        verified_at: p.verification?.status ? now() : null,
        lead_score: typeof p.confidence === "number" ? p.confidence : null,
      });
      if (!leadErr) inserted += 1;
    }

    logs.push({ at: now(), level: "info", message: `Discovered company: ${company.id ? d.organization || domain : domain}.` });
    logs.push({ at: now(), level: "info", message: `Inserted ${inserted} real contact(s) from Hunter.io.` });
    return finishJob(supabase, jobId, logs, { status: "completed", resultCount: inserted });
  } catch (err: any) {
    logs.push({ at: now(), level: "error", message: err.message });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: err.message });
  }
}

// ---------------------------------------------------------------------------
// Apollo.io — People Search (real, filtered discovery)
// Docs: https://docs.apollo.io/reference/people-search
// ---------------------------------------------------------------------------
async function runApolloSearch(
  supabase: any,
  orgId: string,
  filters: { title: string; industry: string; seniority: string; location: string },
): Promise<JobResult> {
  const { jobId, logs } = await createJob(supabase, orgId, "search_generate", filters, "apollo.io");
  const apiKey = process.env["APOLLO_API_KEY"];

  if (!apiKey) {
    logs.push({ at: now(), level: "error", message: "APOLLO_API_KEY is not configured. Add it in Settings → API keys." });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: "APOLLO_API_KEY is missing." });
  }

  try {
    logs.push({ at: now(), level: "info", message: "Querying Apollo.io People Search..." });
    const body: Record<string, unknown> = { page: 1, per_page: 20 };
    if (filters.title) body["person_titles"] = [filters.title];
    if (filters.seniority) body["person_seniorities"] = [filters.seniority.toLowerCase()];
    if (filters.location) body["person_locations"] = [filters.location];
    if (filters.industry) body["q_organization_keyword_tags"] = [filters.industry];

    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify(body),
    });
    const json: any = await res.json();

    if (!res.ok) {
      const msg = json?.error || `Apollo API error (${res.status})`;
      logs.push({ at: now(), level: "error", message: msg });
      return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: msg });
    }

    const people = (json.people || []) as any[];
    let inserted = 0;
    for (const p of people) {
      const org = p.organization || {};
      let companyId: string | null = null;
      if (org.name) {
        const { data: company } = await supabase
          .from("companies")
          .insert({
            org_id: orgId,
            name: org.name,
            domain: org.primary_domain || null,
            industry: org.industry || null,
            employee_count: typeof org.estimated_num_employees === "number" ? org.estimated_num_employees : null,
            headquarters: [org.city, org.state, org.country].filter(Boolean).join(", ") || null,
            source: "apollo_search",
          })
          .select("id")
          .single();
        companyId = company?.id ?? null;
      }

      const { error: leadErr } = await supabase.from("leads").insert({
        org_id: orgId,
        company_id: companyId,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        title: p.title || null,
        seniority: p.seniority || null,
        email: p.email && p.email !== "email_not_unlocked@domain.com" ? p.email : null,
        phone: p.phone_numbers?.[0]?.raw_number || null,
        linkedin_url: p.linkedin_url || null,
        location: [p.city, p.country].filter(Boolean).join(", ") || null,
        source: "apollo_search",
        verification_status: p.email_status === "verified" ? "verified" : "not_checked",
        verification_source: "apollo.io",
        verified_at: p.email_status === "verified" ? now() : null,
      });
      if (!leadErr) inserted += 1;
    }

    logs.push({ at: now(), level: "info", message: `Inserted ${inserted} real contact(s) from Apollo.io.` });
    return finishJob(supabase, jobId, logs, { status: "completed", resultCount: inserted });
  } catch (err: any) {
    logs.push({ at: now(), level: "error", message: err.message });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: err.message });
  }
}

// ---------------------------------------------------------------------------
// People Data Labs — Person Search (real, filtered discovery)
// Docs: https://docs.peopledatalabs.com/docs/person-search-api
// ---------------------------------------------------------------------------
async function runPdlSearch(
  supabase: any,
  orgId: string,
  filters: { title: string; industry: string; seniority: string; location: string },
): Promise<JobResult> {
  const { jobId, logs } = await createJob(supabase, orgId, "search_generate", filters, "peopledatalabs");
  const apiKey = process.env["PDL_API_KEY"];

  if (!apiKey) {
    logs.push({ at: now(), level: "error", message: "PDL_API_KEY is not configured. Add it in Settings → API keys." });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: "PDL_API_KEY is missing." });
  }

  try {
    logs.push({ at: now(), level: "info", message: "Querying People Data Labs Person Search..." });
    const must: any[] = [];
    if (filters.title) must.push({ term: { job_title: filters.title.toLowerCase() } });
    if (filters.industry) must.push({ term: { industry: filters.industry.toLowerCase() } });
    if (filters.location) must.push({ term: { location_name: filters.location.toLowerCase() } });

    const sqlQuery = { query: { bool: { must: must.length ? must : [{ match_all: {} }] } } };

    const res = await fetch("https://api.peopledatalabs.com/v5/person/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({ ...sqlQuery, size: 20 }),
    });
    const json: any = await res.json();

    if (!res.ok) {
      const msg = json?.error?.message || `PDL API error (${res.status})`;
      logs.push({ at: now(), level: "error", message: msg });
      return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: msg });
    }

    const people = (json.data || []) as any[];
    let inserted = 0;
    for (const p of people) {
      let companyId: string | null = null;
      if (p.job_company_name) {
        const { data: company } = await supabase
          .from("companies")
          .insert({
            org_id: orgId,
            name: p.job_company_name,
            domain: p.job_company_website || null,
            industry: p.job_company_industry || null,
            employee_count: typeof p.job_company_size === "string" ? null : null,
            headquarters: p.job_company_location_name || null,
            source: "pdl_search",
          })
          .select("id")
          .single();
        companyId = company?.id ?? null;
      }

      const { error: leadErr } = await supabase.from("leads").insert({
        org_id: orgId,
        company_id: companyId,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        title: p.job_title || null,
        seniority: p.job_title_levels?.[0] || null,
        email: p.work_email || null,
        phone: p.mobile_phone || null,
        linkedin_url: p.linkedin_url ? `https://linkedin.com/in/${p.linkedin_url}` : null,
        location: p.location_name || null,
        source: "pdl_search",
        verification_status: p.work_email ? "not_checked" : "not_checked",
      });
      if (!leadErr) inserted += 1;
    }

    logs.push({ at: now(), level: "info", message: `Inserted ${inserted} real contact(s) from People Data Labs.` });
    return finishJob(supabase, jobId, logs, { status: "completed", resultCount: inserted });
  } catch (err: any) {
    logs.push({ at: now(), level: "error", message: err.message });
    return finishJob(supabase, jobId, logs, { status: "failed", resultCount: 0, errorMessage: err.message });
  }
}

// ---------------------------------------------------------------------------
// Public server functions
// ---------------------------------------------------------------------------
export const runDomainExtract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ domain: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const orgId = await orgIdFor(context.supabase, context.userId);
    const domain = data.domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? data.domain.trim();
    return runHunterDomainExtract(context.supabase, orgId, domain);
  });

export const runSearchGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().optional().default(""),
        industry: z.string().optional().default(""),
        seniority: z.string().optional().default(""),
        location: z.string().optional().default(""),
        provider: z.enum(["apollo", "pdl"]).default("apollo"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const orgId = await orgIdFor(context.supabase, context.userId);
    const { provider, ...filters } = data;
    return provider === "apollo"
      ? runApolloSearch(context.supabase, orgId, filters)
      : runPdlSearch(context.supabase, orgId, filters);
  });

/** Reports only whether a credential is present — never its value. */
export const getApiKeyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const keys = ["HUNTER_API_KEY", "APOLLO_API_KEY", "PDL_API_KEY", "BOUNCER_API_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] as const;
    return keys.map((name) => ({ name, configured: Boolean(process.env[name]) }));
  });
