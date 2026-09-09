import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

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

    return { user: data.user };
  },
  component: () => <Outlet />,
});
