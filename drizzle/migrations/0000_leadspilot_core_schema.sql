-- ENUMS
CREATE TYPE public.lead_source AS ENUM ('hunter_domain','apollo_search','pdl_search','manual');
CREATE TYPE public.verification_status AS ENUM ('verified','unverified','catch_all','invalid','not_checked');
CREATE TYPE public.pipeline_stage AS ENUM ('new','contacted','meeting_scheduled','qualified','in_negotiation','closed_won');
CREATE TYPE public.campaign_event_type AS ENUM ('enrolled','sent','opened','replied','bounced');
CREATE TYPE public.event_source AS ENUM ('real_webhook','manual');

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'free',
  target_industry text,
  target_seniority text[],
  company_size_range text,
  target_geography text,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- USERS (app profile linked to auth.users by id)
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- helper: current user's org
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$;

CREATE POLICY "users read own row" ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR org_id = public.current_org_id());
CREATE POLICY "users insert own row" ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "users update own row" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "org members read org" ON public.organizations FOR SELECT TO authenticated
  USING (id = public.current_org_id());
CREATE POLICY "authenticated create org" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "org members update org" ON public.organizations FOR UPDATE TO authenticated
  USING (id = public.current_org_id()) WITH CHECK (id = public.current_org_id());

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  industry text,
  employee_count integer,
  revenue_range text,
  headquarters text,
  tech_stack jsonb,
  source public.lead_source NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope companies" ON public.companies FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

-- LEADS
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name text,
  last_name text,
  title text,
  seniority text,
  department text,
  email text,
  phone text,
  linkedin_url text,
  location text,
  source public.lead_source NOT NULL DEFAULT 'manual',
  verification_status public.verification_status NOT NULL DEFAULT 'not_checked',
  verification_source text,
  verified_at timestamptz,
  lead_score numeric,
  pipeline_stage public.pipeline_stage NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope leads" ON public.leads FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE INDEX leads_org_idx ON public.leads(org_id);

-- SCRAPE JOBS
CREATE TABLE public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  api_used text,
  status text NOT NULL DEFAULT 'queued',
  result_count integer NOT NULL DEFAULT 0,
  error_message text,
  log_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scrape_jobs TO authenticated;
GRANT ALL ON public.scrape_jobs TO service_role;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope scrape_jobs" ON public.scrape_jobs FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

-- LISTS
CREATE TABLE public.lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#F5A623',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lists TO authenticated;
GRANT ALL ON public.lists TO service_role;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope lists" ON public.lists FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE TABLE public.list_leads (
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, lead_id)
);
GRANT SELECT, INSERT, DELETE ON public.list_leads TO authenticated;
GRANT ALL ON public.list_leads TO service_role;
ALTER TABLE public.list_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope list_leads" ON public.list_leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.org_id = public.current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.lists l WHERE l.id = list_id AND l.org_id = public.current_org_id()));

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

CREATE TABLE public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type public.campaign_event_type NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source public.event_source NOT NULL,
  payload jsonb
);
GRANT SELECT, INSERT ON public.campaign_events TO authenticated;
GRANT ALL ON public.campaign_events TO service_role;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope campaign_events" ON public.campaign_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.org_id = public.current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.org_id = public.current_org_id()));

-- CREDITS LEDGER
CREATE TABLE public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  api_call_ref text,
  balance_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credits_ledger TO authenticated;
GRANT ALL ON public.credits_ledger TO service_role;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope credits read" ON public.credits_ledger FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  razorpay_subscription_id text,
  status text NOT NULL DEFAULT 'inactive',
  renews_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org scope subscriptions read" ON public.subscriptions FOR SELECT TO authenticated
  USING (org_id = public.current_org_id());

-- Bootstrap: create org + user profile for the signed-in auth user
CREATE OR REPLACE FUNCTION public.bootstrap_org(_org_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _org uuid;
  _existing uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT org_id INTO _existing FROM public.users WHERE id = _uid;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  INSERT INTO public.organizations (name) VALUES (coalesce(nullif(_org_name,''), split_part(_email,'@',2)))
    RETURNING id INTO _org;
  INSERT INTO public.users (id, org_id, email, role) VALUES (_uid, _org, _email, 'owner')
    ON CONFLICT (id) DO UPDATE SET org_id = excluded.org_id;
  INSERT INTO public.subscriptions (org_id, plan, status) VALUES (_org, 'free', 'inactive');
  RETURN _org;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_org(text) TO authenticated;