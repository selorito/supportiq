import { Inbox } from "lucide-react";

import { cn } from "../lib/utils";

export function EmptyState({ title, description, className, icon: Icon = Inbox, compact = false }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center",
        compact ? "px-4 py-8" : "px-6 py-10",
        className,
      )}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}
