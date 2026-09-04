import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set your default search filters — LeadsPilot" },
      {
        name: "description",
        content:
          "Tell LeadsPilot which industry, seniority, company size and geography you target so searches start pre-filtered.",
      },
      { property: "og:title", content: "Set your default search filters — LeadsPilot" },
      {
        property: "og:description",
        content: "Capture your ideal customer profile as reusable default search filters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const SENIORITIES = ["C-Suite", "VP", "Director", "Manager", "Senior IC", "IC"];
const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1001-5000", "5000+"];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useOrg();
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [seniority, setSeniority] = useState<string[]>([]);
  const [size, setSize] = useState("");
  const [geo, setGeo] = useState("");
  const [busy, setBusy] = useState(false);

  const steps = [
    {
      title: "Which industry do you sell into?",
      hint: "Used as the default industry filter on searches.",
      body: (
        <Input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. SaaS, Logistics, Fintech"
        />
      ),
    },
    {
      title: "Which seniority levels do you target?",
      hint: "Pick as many as apply.",
      body: (
        <div className="flex flex-wrap gap-2">
          {SENIORITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                setSeniority((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                )
              }
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                seniority.includes(s)
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What company size fits best?",
      hint: "Employee count range.",
      body: (
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                size === s
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-primary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Which geography do you focus on?",
      hint: "Country, region or city.",
      body: (
        <Input
          value={geo}
          onChange={(e) => setGeo(e.target.value)}
          placeholder="e.g. United States, DACH, Bengaluru"
        />
      ),
    },
  ];

  async function finish() {
    if (!data?.org?.id) {
      toast.error("No organization found for your account.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        target_industry: industry || null,
        target_seniority: seniority.length ? seniority : null,
        company_size_range: size || null,
        target_geography: geo || null,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", data.org.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Default search filters saved.");
    navigate({ to: "/leads" });
  }

  const current = steps[step] ?? steps[0]!;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted px-6 py-12">
      <div className="w-full max-w-xl">
        <Logo size="lg" />
        <div className="surface-card mt-6 p-8">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
          <p className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Step {step + 1} of {steps.length}
          </p>
          <h1 className="mt-2 text-xl font-bold">{current.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{current.hint}</p>
          <div className="mt-6">
            <Label className="sr-only">{current.title}</Label>
            {current.body}
          </div>
          <div className="mt-8 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate({ to: "/leads" }) : setStep(step - 1))}
            >
              {step === 0 ? "Skip for now" : "Back"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}
            >
              {step === steps.length - 1 ? "Save filters" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
