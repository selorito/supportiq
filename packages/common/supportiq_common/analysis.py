from __future__ import annotations

import json
import os
import re
from math import sqrt
from typing import Any

from openai import OpenAI

from .schemas import AnalysisResult


class TicketAnalyzer:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def analyze(self, subject: str, message: str) -> AnalysisResult:
        if self.client:
            try:
                return self._analyze_with_openai(subject, message)
            except Exception:
                pass
        return self._analyze_with_rules(subject, message)

    def answer_question(self, subject: str, message: str, analysis: AnalysisResult | dict | None, question: str) -> tuple[str, str]:
        if self.client:
            try:
                return self._answer_with_openai(subject, message, analysis, question), "openai"
            except Exception:
                pass
        return self._answer_with_rules(subject, message, analysis, question), "rules"

    def _analyze_with_openai(self, subject: str, message: str) -> AnalysisResult:
        prompt = f"""
Classify this support ticket and return strict JSON only.

Subject: {subject}
Message: {message}

JSON fields:
- category
- priority
- sentiment
- summary
- explanation
- assigned_team
- suggested_reply
- confidence_score
- model_source

Rules:
- category, priority, sentiment and assigned_team must be short snake_case strings
- priority must be one of: low, medium, high
- sentiment must be one of: positive, neutral, negative
- summary must be one short sentence
- explanation must explain why the ticket got its category and priority
- suggested_reply must be professional and customer-ready
- confidence_score must be between 0 and 1
- model_source must be "openai"
- summary, explanation and suggested_reply should be in the same language as the customer message when possible
"""
        response = self.client.responses.create(
            model=self.model,
            input=[
                {"role": "system", "content": "You are a support ticket intelligence engine that returns strict JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        content = self._extract_text(response)
        payload = json.loads(content)
        payload.setdefault("model_source", "openai")
        return AnalysisResult.model_validate(payload)

    def _answer_with_openai(self, subject: str, message: str, analysis: AnalysisResult | dict | None, question: str) -> str:
        analysis_payload = analysis.model_dump() if isinstance(analysis, AnalysisResult) else (analysis or {})
        prompt = f"""
You are an AI copilot assisting a support agent.

Ticket subject: {subject}
Ticket message: {message}
Ticket analysis: {json.dumps(analysis_payload, ensure_ascii=False)}

Agent question: {question}

Answer clearly in at most 4 short sentences. Be specific and actionable.
"""
        response = self.client.responses.create(
            model=self.model,
            input=[
                {"role": "system", "content": "You are a concise support operations copilot."},
                {"role": "user", "content": prompt},
            ],
        )
        return self._extract_text(response).strip()

    def _extract_text(self, response: Any) -> str:
        if hasattr(response, "output_text") and response.output_text:
            return response.output_text

        fragments: list[str] = []
        for item in getattr(response, "output", []):
            for content in getattr(item, "content", []):
                text = getattr(content, "text", None)
                if text:
                    fragments.append(text)
        if not fragments:
            raise ValueError("No text returned from OpenAI response")
        return "".join(fragments)

    def _analyze_with_rules(self, subject: str, message: str) -> AnalysisResult:
        text = f"{subject}\n{message}".lower()

        category = "general_support"
        assigned_team = "support"
        priority = "medium"
        sentiment = "neutral"
        category_reason = "mesaj genel destek niteliğinde görünüyor"
        priority_reasons: list[str] = []
        sentiment_reason = "mesaj nötr bir ton taşıyor"

        if any(word in text for word in ["bug", "error", "login", "crash", "çalışmıyor", "technical", "release", "exception"]):
            category = "technical_issue"
            assigned_team = "technical_support"
            category_reason = "giriş, hata veya çökme gibi teknik sinyaller içeriyor"
        elif any(word in text for word in ["refund", "iade", "payment", "invoice", "charge", "billing"]):
            category = "billing_issue"
            assigned_team = "finance"
            category_reason = "iade veya ödeme ile ilgili ifadeler içeriyor"
        elif self._contains_any_pattern(
            text,
            [
                r"\bkargo\b",
                r"\bshipment\b",
                r"\bdelivery\b",
                r"\bcargo\b",
                r"\bdelayed\b",
                r"\bdelay\b",
                r"\blost package\b",
            ],
        ):
            category = "delivery_issue"
            assigned_team = "customer_operations"
            category_reason = "kargo, teslimat veya gecikme ifadeleri içeriyor"
        elif any(word in text for word in ["price", "plan", "demo", "sales", "quote", "fiyat"]):
            category = "sales_request"
            assigned_team = "sales"
            category_reason = "fiyat, paket veya satış odaklı talep içeriyor"

        if any(word in text for word in ["urgent", "acil", "immediately", "asap", "legal", "angry"]):
            priority = "high"
            priority_reasons.append("acil veya eskalasyon dili kullanılıyor")
        if any(word in text for word in ["refund", "iade", "5 gün", "5 day", "delayed", "vip"]):
            priority = "high"
            priority_reasons.append("müşteri iade veya uzun gecikme belirtiyor")
        elif not priority_reasons and any(word in text for word in ["question", "soru", "when", "ne zaman"]):
            priority = "low"
            priority_reasons.append("mesaj bilgi talebi niteliğinde")

        if any(word in text for word in ["not happy", "worst", "cancel", "angry", "şikayet", "berbat", "iade", "refund", "delayed"]):
            sentiment = "negative"
            sentiment_reason = "mesaj olumsuz duygu ve memnuniyetsizlik sinyali veriyor"
        elif any(word in text for word in ["thanks", "teşekkür", "great", "memnun"]):
            sentiment = "positive"
            sentiment_reason = "mesaj memnuniyet veya teşekkür ifadesi içeriyor"

        if not priority_reasons:
            priority_reasons.append("mesaj standart işlem önceliğinde görünüyor")

        condensed = " ".join(message.strip().split())
        summary = condensed[:180] + ("..." if len(condensed) > 180 else "")
        suggested_reply = self._build_reply(category, priority)
        explanation = (
            f"Kategori {self._humanize(category)} olarak seçildi çünkü {category_reason}. "
            f"Öncelik {self._humanize(priority)} çünkü {', '.join(priority_reasons)}. "
            f"Duygu {self._humanize(sentiment)} çünkü {sentiment_reason}."
        )

        return AnalysisResult(
            category=category,
            priority=priority,
            sentiment=sentiment,
            summary=summary or subject,
            explanation=explanation,
            assigned_team=assigned_team,
            suggested_reply=suggested_reply,
            confidence_score=0.62,
            model_source="rules",
        )

    def _answer_with_rules(self, subject: str, message: str, analysis: AnalysisResult | dict | None, question: str) -> str:
        payload = analysis.model_dump() if isinstance(analysis, AnalysisResult) else (analysis or {})
        question_lower = question.lower()
        summary = payload.get("summary") or "Talebin özeti henüz oluşturulmadı."
        reply = payload.get("suggested_reply") or self._build_reply(payload.get("category", "general_support"), payload.get("priority", "medium"))
        explanation = payload.get("explanation") or "Yapay zeka açıklaması henüz hazır değil."
        priority = payload.get("priority", "medium")

        if any(token in question_lower for token in ["reply", "cevap", "respond", "yanıt"]):
            return f"Önerilen yanıt şu anda şöyle: {reply}"
        if any(token in question_lower for token in ["summary", "özet", "summarize"]):
            return f"Kısa özet: {summary}"
        if any(token in question_lower for token in ["urgent", "acil", "urgent?", "is this urgent"]):
            return f"Bu talep {self._humanize(priority)} öncelikte görünüyor. {explanation}"
        return (
            f"Talep konusu '{subject}'. Özet: {summary} "
            f"Müşteri mesajı: {message[:160]}{'...' if len(message) > 160 else ''} "
            f"Yapay zeka değerlendirmesi: {explanation}"
        )

    def _build_reply(self, category: str, priority: str) -> str:
        if category == "delivery_issue":
            return (
                "Bize ulaştığınız için teşekkür ederiz. Teslimat gecikmesini inceliyoruz ve en kısa sürede güncel durum ile sonraki adımları paylaşacağız."
            )
        if category == "billing_issue":
            return (
                "Talebiniz için teşekkür ederiz. Finans ekibimiz iade ve ödeme detaylarını kontrol ediyor, en kısa sürede size net bir çözümle dönüş yapacağız."
            )
        if category == "technical_issue":
            return (
                "Sorunu bize bildirdiğiniz için teşekkür ederiz. Teknik ekibimiz hatayı incelemeye başladı, kısa süre içinde yeni bilgi paylaşacağız."
            )
        if priority == "high":
            return (
                "Mesajınız için teşekkür ederiz. Talebinizi yüksek öncelik ile ilgili ekibe yönlendirdik ve hızlı geri dönüş için süreci yakından takip ediyoruz."
            )
        return (
            "Destek ekibimize ulaştığınız için teşekkür ederiz. Talebinizi aldık ve ilgili ekibe yönlendirdik. En kısa sürede sizinle paylaşım yapacağız."
        )

    def _contains_any_pattern(self, text: str, patterns: list[str]) -> bool:
        return any(re.search(pattern, text) for pattern in patterns)

    def _humanize(self, value: str) -> str:
        mapping = {
            "technical_issue": "teknik sorun",
            "billing_issue": "finans talebi",
            "delivery_issue": "teslimat sorunu",
            "sales_request": "satış talebi",
            "general_support": "genel destek",
            "high": "yüksek",
            "medium": "orta",
            "low": "düşük",
            "negative": "negatif",
            "positive": "pozitif",
            "neutral": "nötr",
        }
        return mapping.get(value, value.replace("_", " "))

    def embed_text(self, text: str) -> list[float]:
        if self.client:
            try:
                response = self.client.embeddings.create(model=self.embedding_model, input=text)
                return list(response.data[0].embedding)
            except Exception:
                pass
        return self._embed_with_hashing(text)

    def _embed_with_hashing(self, text: str, dimensions: int = 64) -> list[float]:
        vector = [0.0] * dimensions
        tokens = re.findall(r"[a-zA-Z0-9çğıöşüÇĞİÖŞÜ]+", text.lower())
        for token in tokens:
            vector[hash(token) % dimensions] += 1.0
        norm = sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def cosine_similarity(self, left: list[float], right: list[float]) -> float:
        length = min(len(left), len(right))
        if length == 0:
            return 0.0
        return sum(left[index] * right[index] for index in range(length))
