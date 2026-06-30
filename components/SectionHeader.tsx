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
            "mb-2 text-xs font-semibold uppercase tracking-[0.12em] sm:mb-3 sm:text-sm sm:tracking-[0.14em]",
            tone === "light" ? "text-white/80" : "text-loden-700"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-[1.45rem] font-semibold leading-tight sm:text-3xl lg:text-4xl",
          tone === "light" ? "text-white" : "text-loden-ink"
        )}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={cn(
            "mt-2 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-7 lg:text-lg",
            tone === "light" ? "text-white/80" : "text-loden-muted"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
