import { navigate } from "../lib/router";
import { AlertBanner } from "../components/AlertBanner";
import { CustomerTicketList } from "../components/CustomerTicketList";
import { PageHeader } from "../components/PageHeader";
import { TicketDetailPanel } from "../components/TicketDetailPanel";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function CustomerDashboardPage({
  summary,
  tickets,
  selectedTicket,
  selectedTicketId,
  isDashboardLoading,
  isTicketLoading,
  error,
  onSelectTicket,
  notice,
}) {
  return (
    <>
      <PageHeader
        title="Müşteri Paneli"
        description="Açtığınız destek taleplerini, mevcut durumu ve yapay zeka özetlerini tek ekranda izleyin."
        actions={
          <Button variant="secondary" onClick={() => navigate("/create")}>
            Yeni talep oluştur
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Toplam talep" value={summary?.total_tickets ?? 0} />
        <MiniStat label="Açık talep" value={summary?.open_tickets ?? 0} />
        <MiniStat label="Çözülen talep" value={summary?.resolved_tickets ?? 0} />
      </section>

      {notice ? <AlertBanner title={notice.title} description={notice.description} variant={notice.variant} /> : null}
      {error ? <AlertBanner title="İşlem tamamlanamadı" description={error} variant="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <CustomerTicketList tickets={tickets} selectedTicketId={selectedTicketId} onSelectTicket={onSelectTicket} isLoading={isDashboardLoading} />
        <TicketDetailPanel ticket={selectedTicket} isLoading={isTicketLoading} mode="customer" />
      </section>
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
