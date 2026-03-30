import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock3, MessageSquareText, Milestone, NotebookPen } from "lucide-react";

import { formatDate, formatLabel } from "../lib/format";
import { AIInsights } from "./AIInsights";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

export function TicketDetailPanel({
  ticket,
  isLoading,
  onResolve,
  onOpenAssistant,
  onReanalyze,
  isReanalyzing,
  onAddNote,
  isAddingNote,
  mode = "agent",
}) {
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    setNoteBody("");
  }, [ticket?.id]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="border-b border-slate-200">
          <div>
            <CardTitle>Talep Detayı</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Seçili talep yükleniyor.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className="h-full">
        <CardHeader className="border-b border-slate-200">
          <div>
            <CardTitle>Talep Detayı</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Listeden bir talep seçildiğinde ayrıntılar burada görünür.</p>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-medium text-slate-900">Henüz seçili talep yok</p>
            <p className="mt-2 text-sm text-slate-500">Durum, yapay zeka içgörüleri, SLA bilgisi ve zaman akışı bu panelde yer alır.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAnalyzing = !ticket.analysis;
  const notes = ticket.notes ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-slate-200">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="pr-2 text-lg">{ticket.subject}</CardTitle>
              <p className="text-sm text-slate-500">
                {ticket.customer_name} · {ticket.customer_email}
              </p>
            </div>
            <Badge variant={ticket.status === "resolved" ? "success" : "secondary"}>{formatLabel(ticket.status)}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MetaInline label="Destek durumu" value={formatLabel(ticket.status)} />
            <MetaInline label="Kanal" value={formatLabel(ticket.source)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 overflow-y-auto p-5 scrollbar-subtle">
        <Section title="Ticket Details" subtitle="Müşteri mesajı ve temel bağlam" icon={MessageSquareText}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-700">{ticket.message}</p>
          </div>
        </Section>

        <Separator />

        <AIInsights
          analysis={ticket.analysis}
          isAnalyzing={isAnalyzing}
          canInteract={mode === "agent"}
          onOpenAssistant={onOpenAssistant}
          onReanalyze={onReanalyze}
          isReanalyzing={isReanalyzing}
        />

        <Separator />

        <Section title="SLA Status" subtitle="Atama ve zaman hedefleri" icon={Clock3}>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetaCard label="Atanan ekip" value={formatLabel(ticket.analysis?.assigned_team ?? "pending")} />
            <MetaCard label="SLA durumu" value={formatLabel(ticket.sla_status ?? "pending")} />
            <MetaCard label="İlk yanıt hedefi" value={ticket.response_due_at ? formatDate(ticket.response_due_at) : "Henüz yok"} />
            <MetaCard label="Çözüm hedefi" value={ticket.resolution_due_at ? formatDate(ticket.resolution_due_at) : "Henüz yok"} />
          </div>
        </Section>

        <Separator />

        <Section title="Ticket Activity Timeline" subtitle="Sistem ve ekip hareketleri" icon={Milestone}>
          <div className="space-y-4">
            {ticket.events?.length ? null : <p className="text-sm text-slate-500">Henüz zaman akışı girdisi yok.</p>}
            {ticket.events?.slice(-6).reverse().map((event) => (
              <div className="flex gap-3" key={event.id}>
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  {iconForEvent(event.event_type)}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-900">{formatLabel(event.event_type)}</p>
                  <p className="text-sm leading-6 text-slate-600">{buildEventNarrative(event)}</p>
                  <p className="text-xs text-slate-400">{formatDate(event.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {mode === "agent" ? (
          <>
            <Separator />

            <Section title="Internal Notes" subtitle="Temsilci iç notları" icon={NotebookPen}>
              <div className="space-y-4">
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!noteBody.trim() || !onAddNote) return;
                    const added = await onAddNote(noteBody.trim());
                    if (added) setNoteBody("");
                  }}
                >
                  <Input value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="İç not ekleyin" />
                  <div className="flex justify-end">
                    <Button variant="secondary" type="submit" disabled={isAddingNote || !noteBody.trim()}>
                      {isAddingNote ? "Ekleniyor..." : "İç not ekle"}
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  {notes.length === 0 ? <p className="text-sm text-slate-500">Henüz iç not eklenmedi.</p> : null}
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{note.author_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(note.created_at)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{note.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </>
        ) : null}

        {mode === "agent" && ticket.status !== "resolved" ? (
          <Button className="w-full justify-center" onClick={() => onResolve(ticket.id)}>
            <CheckCircle2 className="h-4 w-4" />
            Talebi çözüldü olarak işaretle
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{title}</p>
        </div>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MetaInline({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function iconForEvent(eventType) {
  if (eventType === "ticket_analyzed") return <SparkEvent />;
  if (eventType === "status_changed") return <CheckCircle2 className="h-4 w-4" />;
  return <CircleAlert className="h-4 w-4" />;
}

function SparkEvent() {
  return <span className="text-xs font-semibold text-brand-600">YZ</span>;
}

function buildEventNarrative(event) {
  const payload = parsePayload(event.payload);

  if (event.event_type === "ticket_created") {
    return "Müşteri talebi sisteme alındı ve yapay zeka kuyruğuna gönderildi.";
  }
  if (event.event_type === "ticket_analyzed") {
    return `Yapay zeka analizi tamamlandı. Öncelik ${formatLabel(payload.priority)} olarak belirlendi ve ${formatLabel(payload.assigned_team)} ekibine yönlendirildi.`;
  }
  if (event.event_type === "status_changed") {
    return `Talep durumu ${formatLabel(payload.status)} olarak güncellendi.`;
  }
  if (event.event_type === "ai_reanalysis_requested") {
    return "Yapay zeka önerisi yeniden üretilecek şekilde kuyruğa alındı.";
  }
  if (event.event_type === "ai_assistant_answered") {
    return "Yapay zeka yardımcısı, temsilci için ek bağlam ve cevap önerisi oluşturdu.";
  }
  if (event.event_type === "note_added") {
    return "Temsilci talep üzerinde iç not bıraktı.";
  }

  return "Sistem üzerinde yeni bir işlem gerçekleşti.";
}

function parsePayload(value) {
  try {
    return JSON.parse(value ?? "{}");
  } catch {
    return {};
  }
}
