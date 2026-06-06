import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MotionReveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const style = {
    "--reveal-delay": `${delay}s`
  } as CSSProperties;

  return (
    <div className={cn("motion-reveal", className)} style={style}>
      {children}
    </div>
  );
}
