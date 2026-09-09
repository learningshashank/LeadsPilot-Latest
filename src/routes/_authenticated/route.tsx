import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() reads the persisted session directly (fast, no network
    // round-trip) rather than getUser()'s server verification call — this
    // matters right after an OAuth redirect, where a slower check could
    // race against session establishment and incorrectly bounce the user
    // back to /auth.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) throw redirect({ to: "/auth" });
    const user = data.session.user;

    // Ensure an organization exists for this user. Safe to call on every
    // authenticated page load: bootstrap_org is expected to be idempotent
    // server-side (no-op if the user already has an org). This covers
    // Google OAuth sign-ins too, since those land here straight from
    // Supabase's own redirect — there's no other client-side hook after
    // an OAuth callback to call this from.
    const { error: bootstrapError } = await supabase.rpc("bootstrap_org", { _org_name: "" });
    if (bootstrapError) {
      console.error("[bootstrap_org] failed:", bootstrapError.message);
    }

    return { user };
  },
  component: () => <Outlet />,
});
