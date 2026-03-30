const FLOW_STEPS = [
  "Müşteri talep gönderir",
  "Yapay zeka talebi analiz eder",
  "Sistem öncelik ve ekip atar",
  "Temsilci sorunu çözer",
];

export function ProductStorySection() {
  return (
    <section className="product-story">
      <div className="product-story-hero">
        <span className="detail-label">Ürün Hikâyesi</span>
        <p>SupportIQ, gelen müşteri taleplerini destek ekipleri için net aksiyonlara dönüştürür.</p>
      </div>

      <div className="story-grid">
        <div className="story-card">
          <span className="detail-label">Problem</span>
          <p>Destek ekipleri yüksek hacimli ve dağınık taleplerle uğraşır.</p>
        </div>
        <div className="story-card">
          <span className="detail-label">Çözüm</span>
          <p>SupportIQ, talepleri otomatik olarak analiz eder, önceliklendirir ve yönlendirir.</p>
        </div>
      </div>

      <div className="flow-strip">
        {FLOW_STEPS.map((step, index) => (
          <div className="flow-step" key={step}>
            <span className="flow-step-index">{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
