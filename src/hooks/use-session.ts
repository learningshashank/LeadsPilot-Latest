import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/** Current app user row + organization (null until bootstrapped). */
export function useOrg() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data: me, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, org_id")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!me?.org_id) return { me: me ?? null, org: null };
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", me.org_id)
        .maybeSingle();
      if (orgErr) throw orgErr;
      return { me, org };
    },
  });
}

/** Credit balance is the balance_after of the newest ledger row, or 0. */
export function useCreditBalance(orgId?: string | null) {
  return useQuery({
    queryKey: ["credits", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credits_ledger")
        .select("balance_after, created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.balance_after != null ? Number(data[0].balance_after) : 0;
    },
  });
}
