import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "../lib/utils";

const variants = {
  info: {
    wrapper: "border-brand-200 bg-brand-50 text-brand-900",
    text: "text-brand-700",
    Icon: Info,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    text: "text-emerald-700",
    Icon: CheckCircle2,
  },
  danger: {
    wrapper: "border-red-200 bg-red-50 text-red-900",
    text: "text-red-700",
    Icon: AlertCircle,
  },
};

export function AlertBanner({ title, description, variant = "info", className, action }) {
  const config = variants[variant] ?? variants.info;
  const Icon = config.Icon;

  return (
    <div className={cn("flex items-start justify-between gap-4 rounded-2xl border px-4 py-3", config.wrapper, className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          {title ? <p className="text-sm font-medium">{title}</p> : null}
          {description ? <p className={cn("text-sm", config.text)}>{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
