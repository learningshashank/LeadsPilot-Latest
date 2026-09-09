import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse: any) => {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await res.json();

      // Store user information
      localStorage.setItem("leadspilot_user", JSON.stringify(profile));

      // Redirect to dashboard or workspace
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Failed to fetch Google user profile:", error);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => console.error("Google Login Failed"),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
            <svg
              className="h-6 w-6 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Leads<span className="text-amber-500">Pilot</span>
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to your LeadsPilot workspace.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Work email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Log in
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-background px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        {/* Attached Google Login Handler */}
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="flex w-full items-center justify-center rounded-md border border-input bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Continue with Google
        </button>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground">
          New to LeadsPilot?{" "}
          <a href="/register" className="font-semibold text-foreground underline">
            Create a workspace
          </a>
        </p>
      </div>
    </div>
  );
}