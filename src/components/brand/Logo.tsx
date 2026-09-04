import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const badge = size === "lg" ? "size-10" : size === "sm" ? "size-6" : "size-8";
  const icon = size === "lg" ? "size-5" : size === "sm" ? "size-3.5" : "size-4";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-foreground text-background",
          badge,
        )}
      >
        <Zap className={cn(icon, "fill-current")} strokeWidth={2} />
      </span>
      <span className={cn("font-extrabold tracking-tight text-foreground", text)}>
        Leads<span className="text-primary">Pilot</span>
      </span>
    </span>
  );
}
