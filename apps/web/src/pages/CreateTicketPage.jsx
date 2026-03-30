import { navigate } from "../lib/router";
import { AlertBanner } from "../components/AlertBanner";
import { PageHeader } from "../components/PageHeader";
import { TicketForm } from "../components/TicketForm";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const PIPELINE_STEPS = [
  {
    title: "Talep alınır",
    description: "Mesaj, kanal ve müşteri bilgisi tek kayıt altında toplanır.",
  },
  {
    title: "Yapay zeka analiz eder",
    description: "Kategori, öncelik, duygu, özet ve önerilen yanıt üretilir.",
  },
  {
    title: "SLA atanır",
    description: "Önceliğe göre ilk yanıt ve çözüm penceresi hesaplanır.",
  },
  {
    title: "Ekibe yönlenir",
    description: "Talep doğru takıma aktarılır ve panel gerçek zamanlı güncellenir.",
  },
];

export function CreateTicketPage({ onSubmit, isSubmitting, error, currentUser, notice }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Talep"
        description="Talebi oluşturun. Gönderimden sonra SupportIQ otomatik analiz başlatır ve sizi panele geri yönlendirir."
        actions={
          <Button variant="ghost" onClick={() => navigate("/")}>
            Panele dön
          </Button>
        }
      />

      {notice ? <AlertBanner title={notice.title} description={notice.description} variant={notice.variant} /> : null}
      {error ? <AlertBanner title="Talep oluşturulamadı" description={error} variant="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <TicketForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error=""
          onCancel={() => navigate("/")}
          currentUser={currentUser}
          role={currentUser?.role}
        />

        <aside className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <div className="space-y-1">
                <CardTitle>Oluşturduktan sonra ne olur?</CardTitle>
                <p className="text-sm text-slate-500">Talep gönderildiğinde SupportIQ arka planda bu adımları işletir.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {PIPELINE_STEPS.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">{index + 1}</div>
                  <div>
                    <p className="font-medium text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <AlertBanner
            title="Gönderim sonrası"
            description="Talep listeye hemen düşer. Analiz tamamlanana kadar panelde `YZ analiz ediyor` durumunu görürsünüz."
            variant="info"
          />
        </aside>
      </section>
    </div>
  );
}
