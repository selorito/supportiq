import { AlertBanner } from "../components/AlertBanner";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { BarChartCard, DonutChartCard } from "../components/Charts";
import { Card, CardContent } from "../components/ui/card";

export function AnalyticsPage({ summary }) {
  const hasAnyData =
    Object.keys(summary?.category_distribution ?? {}).length > 0 ||
    Object.keys(summary?.priority_distribution ?? {}).length > 0 ||
    Object.keys(summary?.sentiment_distribution ?? {}).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analitik" description="Kategori, öncelik ve duygu dağılımını hızlıca okuyun." />

      <section className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Toplam Talep" value={summary?.total_tickets ?? 0} />
        <MiniStat label="Analiz Edilen" value={summary?.analyzed_tickets ?? 0} />
        <MiniStat label="SLA İhlal Oranı" value={`%${Math.round(summary?.sla_breach_rate ?? 0)}`} />
      </section>

      {!hasAnyData ? (
        <EmptyState
          title="Henüz analitik verisi yok"
          description="Talep geldikçe ve yapay zeka analiz tamamladıkça dağılım grafikleri burada oluşacak."
        />
      ) : (
        <section className="grid gap-6 xl:grid-cols-3">
          <BarChartCard title="Kategori Dağılımı" data={summary?.category_distribution} />
          <BarChartCard title="Öncelik Dağılımı" data={summary?.priority_distribution} />
          <DonutChartCard title="Duygu Dağılımı" data={summary?.sentiment_distribution} />
        </section>
      )}

      <AlertBanner
        title="Analitik yorumu"
        description="Bu ekran, destek operasyonunda en sık gelen konu tiplerini ve öncelik yoğunluğunu hızlıca görmeniz için tasarlandı."
        variant="info"
      />
    </div>
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
