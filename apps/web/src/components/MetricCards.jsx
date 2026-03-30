import { AlertTriangle, BarChart3, CheckCircle2, Inbox } from "lucide-react";

import { Card, CardContent } from "./ui/card";

export function MetricCards({ summary }) {
  const resolutionRate =
    summary?.total_tickets && summary.total_tickets > 0
      ? `${Math.round((summary.resolved_tickets / summary.total_tickets) * 100)}%`
      : "0%";

  const stats = [
    { label: "Toplam Talep", value: summary?.total_tickets ?? 0, icon: Inbox },
    { label: "Açık Talep", value: summary?.open_tickets ?? 0, icon: BarChart3 },
    { label: "SLA İhlali", value: summary?.sla_breached_tickets ?? 0, icon: AlertTriangle },
    { label: "Çözüm Oranı", value: resolutionRate, icon: CheckCircle2 },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
