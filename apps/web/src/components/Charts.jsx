import { formatLabel } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function BarChartCard({ title, data }) {
  const entries = Object.entries(data ?? {});
  const max = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {entries.length === 0 ? <p className="text-sm text-slate-500">Henüz veri yok.</p> : null}
        {entries.map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">{formatLabel(key)}</span>
              <strong className="font-medium text-slate-900">{value}</strong>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DonutChartCard({ title, data }) {
  const entries = Object.entries(data ?? {});
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let offset = 0;
  const colors = ["#2563eb", "#60a5fa", "#93c5fd", "#cbd5e1", "#94a3b8"];

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center">
        <svg viewBox="0 0 42 42" className="mx-auto h-36 w-36 shrink-0" aria-hidden="true">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
          {entries.map(([key, value], index) => {
            const fraction = total ? value / total : 0;
            const dash = `${fraction * 100} ${100 - fraction * 100}`;
            const segment = (
              <circle
                key={key}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="6"
                strokeDasharray={dash}
                strokeDashoffset={25 - offset}
              />
            );
            offset += fraction * 100;
            return segment;
          })}
        </svg>
        <div className="w-full space-y-3">
          {entries.length === 0 ? <p className="text-sm text-slate-500">Henüz veri yok.</p> : null}
          {entries.map(([key, value], index) => (
            <div className="flex items-center justify-between gap-3" key={key}>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span>{formatLabel(key)}</span>
              </div>
              <strong className="text-sm font-medium text-slate-900">{value}</strong>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
