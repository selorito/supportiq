import { ArrowRight, BriefcaseBusiness, LifeBuoy } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function LoginPage({ onLogin, onDemoLogin, isSubmitting, error }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onLogin({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-5xl overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 bg-slate-900 px-8 py-10 text-white lg:border-b-0 lg:border-r">
            <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">S</div>
            <div className="max-w-md space-y-4">
              <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200">SupportIQ</span>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">Yapay zeka ile destek operasyonlarını sadeleştirin.</h1>
              <p className="text-sm leading-6 text-slate-300">
                Müşteriler taleplerini kolayca izler. Temsilciler ise öncelik, SLA ve yapay zeka içgörüleri ile tek ekrandan çalışır.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <LifeBuoy className="h-4 w-4" />
                  Müşteri
                </div>
                <p className="text-sm text-slate-300">Talep oluşturur, mevcut durumunu takip eder ve yapay zeka özetini görür.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Temsilci
                </div>
                <p className="text-sm text-slate-300">Kuyruğu yönetir, SLA riskini izler ve yapay zeka desteği ile yanıt üretir.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="mb-6 space-y-2">
              <h2 className="font-heading text-2xl font-semibold text-slate-900">Giriş yap</h2>
              <p className="text-sm text-slate-500">Demo hesaplarıyla devam edebilir veya bilgileri elle girebilirsin.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">E-posta</span>
                <Input name="email" type="email" placeholder="agent@supportiq.dev" required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Şifre</span>
                <Input name="password" type="password" placeholder="demo123" required />
              </label>

              <Button className="w-full justify-center" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="my-6 h-px bg-slate-200" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" className="justify-center" onClick={() => onDemoLogin("customer")} disabled={isSubmitting}>
                Müşteri olarak devam et
              </Button>
              <Button variant="secondary" className="justify-center" onClick={() => onDemoLogin("agent")} disabled={isSubmitting}>
                Temsilci olarak devam et
              </Button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">Demo hesapları</p>
              <p className="mt-1">
                <code>customer@supportiq.dev</code> ve <code>agent@supportiq.dev</code> için şifre <code>demo123</code>.
              </p>
            </div>

            {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
