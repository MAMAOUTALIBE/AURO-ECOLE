import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
  tone = "default",
  className
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-sm font-semibold uppercase tracking-[0.14em]",
            tone === "light" ? "text-white/80" : "text-loden-700"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-semibold leading-tight sm:text-4xl",
          tone === "light" ? "text-white" : "text-loden-ink"
        )}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            tone === "light" ? "text-white/80" : "text-loden-muted"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
