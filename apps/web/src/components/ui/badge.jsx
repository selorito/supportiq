import { cn } from "../../lib/utils";

const variants = {
  default: "border border-slate-200 bg-slate-100 text-slate-700",
  secondary: "border border-slate-200 bg-white text-slate-700",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  danger: "border border-red-200 bg-red-50 text-red-700",
  info: "border border-brand-200 bg-brand-50 text-brand-700",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}
