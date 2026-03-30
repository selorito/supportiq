import { MetricCards } from "../components/MetricCards";
import { AlertBanner } from "../components/AlertBanner";
import { PageHeader } from "../components/PageHeader";
import { TicketDetailPanel } from "../components/TicketDetailPanel";
import { TicketList } from "../components/TicketList";

export function AgentDashboardPage({
  summary,
  tickets,
  selectedTicket,
  selectedTicketId,
  isDashboardLoading,
  isTicketLoading,
  error,
  onSelectTicket,
  onResolve,
  onOpenAssistant,
  onReanalyze,
  isReanalyzing,
  onAddNote,
  isAddingNote,
  notice,
}) {
  return (
    <>
      <PageHeader
        title="Temsilci Paneli"
        description="Talepleri önceliklendirin, SLA riskini yönetin ve yapay zeka ile daha hızlı aksiyon alın."
      />

      <MetricCards summary={summary} />

      {notice ? <AlertBanner title={notice.title} description={notice.description} variant={notice.variant} /> : null}
      {error ? <AlertBanner title="İşlem tamamlanamadı" description={error} variant="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <TicketList
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={onSelectTicket}
          isLoading={isDashboardLoading}
        />
        <TicketDetailPanel
          ticket={selectedTicket}
          isLoading={isTicketLoading}
          onResolve={onResolve}
          onOpenAssistant={onOpenAssistant}
          onReanalyze={onReanalyze}
          isReanalyzing={isReanalyzing}
          onAddNote={onAddNote}
          isAddingNote={isAddingNote}
          mode="agent"
        />
      </section>
    </>
  );
}
