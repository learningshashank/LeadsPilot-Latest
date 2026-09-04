# Leads Pilot

Build "LeadsPilot" — a B2B lead generation and lightweight CRM SaaS platform. Full-stack TypeScript, Tailwind, shadcn/ui.

DESIGN SYSTEM (strict — use these exact tokens throughout, light mode only for now):
- --bg: #FFFFFF
- --bg-muted: #FAFAFA
- --text-primary: #0D0D0D
- --text-secondary: #6B7280
- --accent: #F5A623 (primary CTA color, used for buttons, active states, the word "Pilot" in the wordmark, and small highlight accents)
- --accent-hover: #D9891A
- --accent-muted-bg: #FEF3C7 (badges/pills)
- --highlight: #FDE68A (text underline/marker effect behind key headline phrases)
Logo: bold "Leads" in --text-primary + "Pilot" in --accent, with a small lightning-bolt icon in a black rounded-square badge to the left. Clean, modern SaaS aesthetic — generous whitespace, rounded-xl cards, subtle borders, no heavy shadows.

CORE PRINCIPLE — DATA HONESTY (critical, non-negotiable):
This app must never fabricate or hardcode fake data as if it were real. Every lead/company record must carry a `source` field (e.g. "hunter_domain", "apollo_search", "manual", "pdl_search") and a `verification_status` that reflects a REAL check, not an invented one. Do not generate placeholder "verified" badges, fake phone numbers, fake LinkedIn URLs, or fake engagement stats (opens/replies) anywhere — if real data isn't available for a field, leave it empty/null and label it "Not available" rather than inventing something plausible-looking. This applies to marketing copy too: never claim specific data volumes (e.g. "275M+ verified contacts") that aren't actually true of the connected data sources.

DATABASE SCHEMA (Postgres via Supabase):
- organizations (id, name, plan_tier, created_at)
- users (id, org_id FK, email, role, created_at) — linked to Supabase Auth
- companies (id, org_id FK, name, domain, industry, employee_count, revenue_range, headquarters, tech_stack jsonb, source, created_at)
- leads (id, org_id FK, company_id FK, first_name, last_name, title, seniority, department, email, phone, linkedin_url, source enum('hunter_domain','apollo_search','pdl_search','manual'), verification_status enum('verified','unverified','catch_all','invalid','not_checked'), verification_source, lead_score numeric, pipeline_stage enum('new','contacted','meeting_scheduled','qualified','in_negotiation','closed_won'), created_at)
- scrape_jobs (id, org_id FK, job_type, filters jsonb, api_used, status, result_count, error_message, created_at, completed_at)
- lists (id, org_id FK, name, description, color, created_at)
- list_leads (list_id FK, lead_id FK)
- campaigns (id, org_id FK, name, status, created_at)
- campaign_events (id, campaign_id FK, lead_id FK, event_type enum('enrolled','sent','opened','replied','bounced'), occurred_at, source enum('real_webhook','manual')) — no fabricated stats, only real logged events
- credits_ledger (id, org_id FK, amount, reason, api_call_ref, balance_after, created_at)
- subscriptions (id, org_id FK, plan, razorpay_subscription_id, status, renews_at)

MODULES TO SCAFFOLD (build the shell/UI + DB wiring now, integrations come next):
1. Auth: Supabase email/password + Google OAuth sign-up/login. Enforce work-email at signup (block common free/disposable domains, e.g. gmail.com, mailinator.com etc. — maintain a small blocklist).
2. Onboarding wizard: capture org's target industry, persona/seniority levels, company size range, target geography — save as default search filters.
3. Leads Dashboard: Apollo.io/Zoho-CRM-style data table with filters (industry, seniority, location, verification status, pipeline stage), sortable by lead_score, CSV export, saved Lists sidebar, credit balance widget pulled from credits_ledger (not hardcoded).
4. Scraper page with two entry points: "Company Website / URL Extractor" (single domain input) and "Search & Industry Lead Generator" (persona/title, industry, seniority, location filters) — both should call placeholder API routes for now (we'll wire real Hunter.io / Apollo / PDL calls in the next iteration), and every scrape must create a row in scrape_jobs with real status/result_count, shown in a "Scraper Tasks & Logs" view with genuine log entries (no fabricated "deliverability confirmed" claims).
5. CRM Pipeline: Kanban board across the 6 pipeline_stage values, drag to update.
6. Campaigns: sequence builder UI, enrollment, and a campaign_events-driven stats view (sent/opened/replied counts computed from real event rows, defaulting to 0 until real send integration exists — do not simulate percentages).
7. Settings: org profile, team members, billing placeholder (Razorpay to be wired later), API keys/secrets management page for HUNTER_API_KEY, APOLLO_API_KEY, PDL_API_KEY, BOUNCER_API_KEY.

Marketing/landing page copy should be honest and specific rather than inflated — e.g. "Real, verified B2B contacts sourced from Hunter.io and Apollo.io" instead of any invented number.

Start by scaffolding the schema, auth, design system/theme, and the Leads Dashboard + Scraper page shells. I'll provide real API keys and ask you to wire in Hunter.io, Apollo.io, and People Data Labs in the next messages.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ca486097-9eac-4d1e-9eca-af54d85d762d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
