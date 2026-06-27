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
          "text-2xl font-semibold leading-tight sm:text-4xl",
          tone === "light" ? "text-white" : "text-loden-ink"
        )}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={cn(
            "mt-3 text-sm leading-6 sm:mt-4 sm:text-lg sm:leading-7",
            tone === "light" ? "text-white/80" : "text-loden-muted"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
