import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
        secondary: "border-slate-600 bg-slate-800 text-slate-300",
        destructive: "border-rose-500/40 bg-rose-500/10 text-rose-400",
        outline: "border-slate-700 text-slate-400",
        success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
        danger: "border-red-500/40 bg-red-500/10 text-red-400",
        gold: "border-amber-400/40 bg-amber-400/10 text-amber-400",
        platinum: "border-slate-300/40 bg-slate-300/10 text-slate-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
