import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Database, ShieldCheck, Workflow } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadsPilot — B2B lead sourcing and lightweight CRM" },
      {
        name: "description",
        content:
          "Source B2B contacts from Hunter.io, Apollo.io and People Data Labs, verify them, and run them through a simple pipeline. Every record keeps its source.",
      },
      { property: "og:title", content: "LeadsPilot — B2B lead sourcing and lightweight CRM" },
      {
        property: "og:description",
        content:
          "Source B2B contacts from real providers, keep the source on every record, and work them in a simple pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Database,
    title: "Sourced, not invented",
    body: "Every lead and company row stores the provider it came from — hunter_domain, apollo_search, pdl_search or manual. Fields we don't have stay empty and read \"Not available\".",
  },
  {
    icon: ShieldCheck,
    title: "Verification you can audit",
    body: "Verification status reflects an actual email check and records which service returned it. Nothing is marked verified without a real result.",
  },
  {
    icon: Workflow,
    title: "Pipeline and sequences",
    body: "A six-stage kanban CRM plus a sequence builder. Campaign stats are counted from logged events only, so they start at zero.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          Work email required · No fabricated data
        </span>
        <h1 className="mt-6 text-4xl leading-tight font-extrabold sm:text-5xl">
          Real, verified B2B contacts sourced from{" "}
          <span className="marker-highlight">Hunter.io and Apollo.io</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          LeadsPilot finds decision-makers by domain or by persona search, keeps the
          provider and verification result attached to every record, and gives you a
          lightweight CRM to work them. If we don't have a phone number or a LinkedIn
          profile, we say so instead of guessing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start with your work email <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">I already have an account</Link>
          </Button>
        </div>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {[
            "Source recorded on every row",
            "Empty fields stay empty",
            "Stats from logged events only",
          ].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-primary" /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-bg-muted py-20">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface-card p-6">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="size-4" />
              </span>
              <h2 className="mt-4 text-base font-bold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="surface-card bg-bg-muted p-8 text-center">
          <h2 className="text-2xl font-bold">
            Connect your data providers and start sourcing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Bring your own Hunter.io, Apollo.io and People Data Labs keys. LeadsPilot
            logs every scrape job with its real status and result count.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your workspace
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-sm text-muted-foreground">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} LeadsPilot</p>
        </div>
      </footer>
    </div>
  );
}
