import { Sparkles } from "lucide-react";

import { formatDate, formatLabel } from "../lib/format";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./EmptyState";

export function CustomerTicketList({ tickets, selectedTicketId, onSelectTicket, isLoading }) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <div>
          <CardTitle>Taleplerim</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Yalnızca size ait destek kayıtlarını görün ve son durumu kolayca takip edin.</p>
        </div>
      </CardHeader>

      <CardContent className="max-h-[700px] space-y-3 overflow-y-auto p-5 scrollbar-subtle">
        {isLoading ? <EmptyState compact title="Talep geçmişiniz yükleniyor" description="Son kayıtlar ve yapay zeka sonuçları hazırlanıyor." /> : null}
        {!isLoading && tickets.length === 0 ? (
          <EmptyState compact title="Henüz talep yok" description="Yeni bir talep gönderdiğinizde SupportIQ bunu analiz edip önceliklendirecek." />
        ) : null}

        {!isLoading &&
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                ticket.id === selectedTicketId ? "border-brand-200 bg-brand-50/50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{ticket.subject}</p>
                  <p className="text-sm text-slate-500">{formatDate(ticket.created_at)}</p>
                </div>
                <Badge variant={ticket.status === "resolved" ? "success" : "secondary"}>{formatLabel(ticket.status)}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ticket.analysis ? (
                  <Badge variant="info" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    YZ işlendi
                  </Badge>
                ) : (
                  <Badge variant="secondary">YZ analiz ediyor</Badge>
                )}
                {ticket.analysis?.category ? <Badge variant="secondary">{formatLabel(ticket.analysis.category)}</Badge> : null}
              </div>
            </button>
          ))}
      </CardContent>
    </Card>
  );
}
