import { useEffect, useState } from "react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

function buildInitialForm(currentUser, role) {
  return {
    subject: "",
    message: "",
    customer_name: role === "customer" ? currentUser?.name ?? "" : "",
    customer_email: role === "customer" ? currentUser?.email ?? "" : "",
    source: "web_form",
  };
}

export function TicketForm({ onSubmit, isSubmitting, error, onCancel, currentUser, role }) {
  const [form, setForm] = useState(buildInitialForm(currentUser, role));

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customer_name: role === "customer" ? currentUser?.name ?? "" : prev.customer_name,
      customer_email: role === "customer" ? currentUser?.email ?? "" : prev.customer_email,
    }));
  }, [currentUser, role]);

  function applyDemoPrompt() {
    setForm((prev) => ({
      ...prev,
      subject: "Sipariş gecikti, iade istiyorum",
      message: "Sipariş verdim ama kargom 5 gündür gelmedi. Bu nedenle ücret iadesi talep ediyorum.",
      customer_name: role === "customer" ? currentUser?.name ?? prev.customer_name : "Zeynep Yildiz",
      customer_email: role === "customer" ? currentUser?.email ?? prev.customer_email : "zeynep.yildiz@example.com",
      source: "web_form",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const created = await onSubmit(form);
    if (created) {
      setForm(buildInitialForm(currentUser, role));
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <div className="space-y-1">
          <CardTitle>Yeni Talep Oluştur</CardTitle>
          <p className="text-sm text-slate-500">Talep gönderildiğinde SupportIQ bunu otomatik olarak analiz eder, önceliklendirir ve ekibe yönlendirir.</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {role === "customer" ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Oturum Bilgisi</p>
            <p className="mt-2 font-medium text-slate-900">{currentUser?.name}</p>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={applyDemoPrompt}>
            Demo İçeriği Kullan
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Konu</span>
            <Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Geciken sipariş için iade talebi" required />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Mesaj</span>
            <Textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Müşterinin yaşadığı sorunu doğal dilde girin."
              rows="8"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Müşteri Adı</span>
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                placeholder="Ayşe Demir"
                required
                disabled={role === "customer"}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Müşteri E-postası</span>
              <Input
                type="email"
                value={form.customer_email}
                onChange={(event) => setForm({ ...form, customer_email: event.target.value })}
                placeholder="ayse@example.com"
                required
                disabled={role === "customer"}
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Kanal</span>
            <Select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
              <option value="web_form">Web Formu</option>
              <option value="email">E-posta</option>
              <option value="api">API</option>
            </Select>
          </label>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {onCancel ? (
              <Button variant="ghost" onClick={onCancel}>
                Vazgeç
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Gönderiliyor..." : "Talep Oluştur"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
