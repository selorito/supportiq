const LABELS = {
  delivery_issue: "Teslimat Sorunu",
  billing_issue: "Finans / Faturalama",
  technical_issue: "Teknik Sorun",
  sales_request: "Satış Talebi",
  general_support: "Genel Destek",
  customer_operations: "Müşteri Operasyonları",
  finance: "Finans Ekibi",
  technical_support: "Teknik Destek",
  sales: "Satış Ekibi",
  support: "Destek Ekibi",
  positive: "Pozitif",
  neutral: "Nötr",
  negative: "Negatif",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  web_form: "Web Formu",
  email: "E-posta",
  api: "API",
  openai: "OpenAI",
  rules: "Kural Tabanlı",
  healthy: "Sağlıklı",
  breached: "İhlal Edildi",
  at_risk: "Riskte",
  active: "Aktif",
  resolved: "Çözüldü",
  pending: "Bekleniyor",
  new: "Yeni",
  triaged: "Önceliklendirildi",
  note_added: "Not Eklendi",
  ticket_created: "Talep Oluşturuldu",
  ticket_analyzed: "Yapay Zeka Analizi Tamamlandı",
  status_changed: "Durum Güncellendi",
  ai_reanalysis_requested: "Yapay Zeka İçin Yeniden Analiz İstendi",
  ai_assistant_answered: "Yapay Zeka Yardımcısı Yanıt Üretti",
  customer: "Müşteri",
  agent: "Temsilci",
  processed: "YZ İşlendi",
  analyzing: "YZ Analiz Ediyor",
};

export function formatLabel(value) {
  if (!value) return "Belirsiz";
  return LABELS[value] ?? value.replaceAll("_", " ");
}

export function formatDate(value) {
  if (!value) return "Henüz yok";
  return new Date(value).toLocaleString("tr-TR");
}
