# SupportIQ

SupportIQ, müşteri taleplerini alan, bunları yapay zeka ile analiz eden ve destek ekiplerinin operasyonel olarak yönetmesini sağlayan tam yığın bir destek operasyon platformudur.

Amaç basit:
- müşteri talebi al
- kuyruğa gönder
- yapay zeka ile sınıflandır
- önceliklendir
- doğru ekibe yönlendir
- temsilciye karar desteği ver

## Ürün Özeti

SupportIQ iki farklı kullanıcı deneyimi sunar:

- `Müşteri`
  Talep oluşturur, yalnızca kendi taleplerini görür, durum takibi yapar ve yapay zeka tarafından üretilen özet ile önerilen yanıtı izler.
- `Temsilci`
  Tüm talepleri görür, filtreler, SLA riskini takip eder, iç not ekler, çözüm durumunu günceller ve yapay zeka içgörüleriyle çalışır.

## Öne Çıkan Özellikler

- Mock login ve rol bazlı erişim
- FastAPI tabanlı REST API
- React tabanlı modern dashboard
- PostgreSQL kalıcı veri katmanı
- RabbitMQ üzerinden arka plan işleme
- Worker tabanlı asenkron yapay zeka analizi
- Yapay zeka özet, kategori, öncelik, duygu, ekip ataması ve önerilen yanıt üretimi
- `AI Insights` bölümü ile görünür yapay zeka deneyimi
- İç notlar, zaman akışı ve SLA görünürlüğü
- Analytics sayfasında kategori, öncelik ve duygu dağılımı
- WebSocket ile canlı yenilenme
- Demo hesapları ve demo veri akışı

## Yapay Zeka Ne Yapıyor?

Her yeni talep için sistem şu çıktıları üretir:

- kategori
- öncelik
- duygu analizi
- kısa özet
- atanması önerilen ekip
- profesyonel önerilen yanıt
- güven skoru
- karar açıklaması

OpenAI ana entegrasyon olarak desteklenir. API anahtarı verilmezse sistem rule-based fallback ile çalışmaya devam eder.

## Mimari

### Servisler

- `apps/backend`
  FastAPI API. Kimlik doğrulama, ticket endpoint'leri, dashboard verisi, analytics ve not işlemleri burada.
- `apps/worker`
  RabbitMQ kuyruğunu dinler. Yeni ticket geldiğinde yapay zeka analizini yapar ve sonucu veritabanına yazar.
- `apps/web`
  React frontend. Login, müşteri paneli, temsilci paneli, ticket detay ekranı, yapay zeka içgörüleri ve analytics burada.
- `packages/common`
  Ortak analiz mantığı, sınıflandırma yardımcıları ve embedding/similarity işlevleri burada.
- `infra/postgres`
  Başlangıç SQL ve veritabanı bootstrap dosyaları burada.

### Uçtan Uca Akış

1. Müşteri bir destek talebi oluşturur.
2. Backend ticket kaydını PostgreSQL'e yazar.
3. Backend `ticket_created` olayını RabbitMQ'ya yollar.
4. Worker mesajı tüketir ve analizi başlatır.
5. Yapay zeka kategori, öncelik, duygu, özet ve önerilen yanıt üretir.
6. Analiz sonucu veritabanına kaydedilir.
7. Frontend ticket detayında `AI Insights` alanını günceller.
8. Temsilci SLA, notlar ve zaman akışı ile aksiyon alır.

## Arayüz Yapısı

### Giriş Ekranı

- E-posta + şifre ile giriş
- Demo giriş butonları:
  - `Müşteri olarak devam et`
  - `Temsilci olarak devam et`

### Müşteri Paneli

- Küçük özet satırı
- Kendi taleplerinin listesi
- Seçilen talep için detay paneli
- AI tarafından üretilmiş özet ve önerilen yanıt

### Temsilci Paneli

- 4 KPI kartı:
  - Toplam Ticket
  - Açık Ticket
  - SLA İhlali
  - Çözüm Oranı
- Sol tarafta ana ticket listesi
- Sağ tarafta seçilen ticket detayı
- AI Insights
- SLA durumu
- Zaman akışı
- İç notlar
- AI yardımcı paneli

### Analytics

- Kategori dağılımı
- Öncelik dağılımı
- Duygu dağılımı

## Teknoloji Yığını

- FastAPI
- React
- Tailwind tabanlı UI düzeni
- PostgreSQL
- RabbitMQ
- Docker Compose
- OpenAI API entegrasyonu

## Proje Yapısı

```text
supportiq/
  apps/
    backend/
    web/
    worker/
  infra/
    postgres/
  packages/
    common/
  docker-compose.yml
  README.md
```

## Kurulum

### Gereksinimler

- Docker
- Docker Compose v1 veya v2

### Ortam Değişkenleri

Repoda geliştirme için örnek `.env.example` dosyası bulunur.

İstersen bunu kopyalayıp kullan:

```bash
cp .env.example .env
```

İsteğe bağlı alanlar:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Bu alanlar boş kalırsa sistem fallback analiz ile çalışır.

## Erişim Adresleri

- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`
- RabbitMQ Yönetim Paneli: `http://localhost:15672`

## Demo Hesapları

- `customer@supportiq.dev` / `demo123`
- `agent@supportiq.dev` / `demo123`

## Temel API Uçları

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/tickets`
- `GET /api/tickets`
- `GET /api/tickets/{id}`
- `PATCH /api/tickets/{id}/status`
- `POST /api/tickets/{id}/notes`
- `POST /api/tickets/{id}/reanalyze`
- `GET /api/dashboard/summary`
- `POST /api/dashboard/seed`

## Demo Senaryosu

1. Uygulamayı aç.
2. `Temsilci olarak devam et` ile giriş yap.
3. Ticket listesinde mevcut kayıtları incele.
4. Sağ panelde `AI Insights` alanını aç.
5. Gerekirse `Yeniden analiz et` ile AI çıktısını yenile.
6. İç not ekle veya talebi çözüldü olarak işaretle.
7. `Analytics` sayfasına geçip dağılımları incele.

## Geliştirme Notları

- Frontend hash tabanlı routing kullanır.
- Kimlik doğrulama mock kullanıcılar ile çalışır.
- Sistem canlı güncelleme için WebSocket kullanır.
- Worker servisi kapalıysa ticket oluşur ama AI analizi gecikir.
