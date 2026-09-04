import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { checkWorkEmail } from "@/lib/work-email";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in to LeadsPilot" },
      {
        name: "description",
        content:
          "Log in or create a LeadsPilot workspace with your work email to source and manage B2B leads.",
      },
      { property: "og:title", content: "Sign in to LeadsPilot" },
      {
        property: "og:description",
        content: "Log in or create a LeadsPilot workspace with your work email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/leads" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const check = checkWorkEmail(email);
        if (!check.ok) {
          toast.error(check.reason);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/leads`,
            data: { org_name: orgName || check.domain },
          },
        });
        if (error) throw error;
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          toast.success("Check your inbox to confirm your email, then log in.");
          setIsSignup(false);
          return;
        }
        await supabase.rpc("bootstrap_org", { _org_name: orgName || check.domain });
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.rpc("bootstrap_org", { _org_name: "" });
        navigate({ to: "/leads" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    await supabase.rpc("bootstrap_org", { _org_name: "" });
    navigate({ to: "/leads" });
  }

  return (
    <div className="grid min-h-screen bg-bg-muted lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-8 text-2xl font-bold">
            {isSignup ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Sign up with a work email — free and disposable mailboxes are blocked."
              : "Log in to your LeadsPilot workspace."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup ? (
              <div className="space-y-1.5">
                <Label htmlFor="org">Company name</Label>
                <Input
                  id="org"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {isSignup ? "Create workspace" : "Log in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to LeadsPilot?"}{" "}
            <button
              type="button"
              className="font-semibold text-foreground underline underline-offset-4"
              onClick={() => setIsSignup((v) => !v)}
            >
              {isSignup ? "Log in" : "Create a workspace"}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden flex-col justify-center border-l border-border bg-background px-12 lg:flex">
        <h2 className="max-w-md text-3xl leading-tight font-extrabold">
          Leads with a <span className="marker-highlight">traceable source</span>, not
          a guess.
        </h2>
        <ul className="mt-6 max-w-md space-y-3 text-sm text-muted-foreground">
          <li>Every contact stores the provider it came from.</li>
          <li>Verification status only reflects a real email check.</li>
          <li>Missing phone or LinkedIn data is shown as "Not available".</li>
          <li>Campaign counters come from logged events, starting at zero.</li>
        </ul>
      </div>
    </div>
  );
}
