import { Bot, BrainCircuit, Sparkles, WandSparkles } from "lucide-react";

import { formatLabel } from "../lib/format";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export function AIInsights({ analysis, isAnalyzing, canInteract, onOpenAssistant, onReanalyze, isReanalyzing }) {
  const confidence = Math.round((analysis?.confidence_score ?? 0) * 100);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Insights</span>
          </div>
          <h3 className="font-heading text-base font-semibold text-slate-900">Yapay zeka değerlendirmesi</h3>
        </div>
        {analysis ? (
          <Badge variant="info" className="gap-1">
            <Sparkles className="h-3 w-3" />
            YZ işlendi
          </Badge>
        ) : (
          <Badge variant="secondary">YZ analiz ediyor</Badge>
        )}
      </div>

      {isAnalyzing ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-brand-600 shadow-sm">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-900">Yapay zeka bu talebi analiz ediyor</p>
              <p className="text-sm text-slate-600">Kategori, öncelik, duygu ve yanıt önerisi birkaç saniye içinde oluşturulacak.</p>
            </div>
          </div>
        </div>
      ) : null}

      {analysis ? (
        <>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Summary</p>
              <p className="text-sm font-medium text-slate-900">Yapay zeka tarafından üretilen özet</p>
            </div>
            <p className="text-sm leading-6 text-slate-700">{analysis.summary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InsightBadge label="AI Category" value={formatLabel(analysis.category)} />
            <InsightBadge label="AI Priority" value={formatLabel(analysis.priority)} />
            <InsightBadge label="AI Sentiment" value={formatLabel(analysis.sentiment)} />
            <InsightBadge label="Assigned Team" value={formatLabel(analysis.assigned_team)} />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Confidence</p>
                <p className="text-sm font-medium text-slate-900">Güven skoru</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">%{confidence}</span>
            </div>
            <Progress value={confidence} />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Bot className="h-3.5 w-3.5" />
              <span>Model: {formatLabel(analysis.model_source)}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Suggested Response</p>
              <p className="text-sm font-medium text-slate-900">Yapay zekanın önerdiği yanıt</p>
            </div>
            <p className="text-sm leading-6 text-slate-700">{analysis.suggested_reply}</p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Why did AI decide this?</p>
              <p className="text-sm font-medium text-slate-900">Bu kararın gerekçesi</p>
            </div>
            <p className="text-sm leading-6 text-slate-700">{analysis.explanation}</p>
          </div>
        </>
      ) : null}

      {canInteract ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onOpenAssistant}>
            <WandSparkles className="h-4 w-4" />
            YZ Yardımcısı
          </Button>
          <Button variant="ghost" onClick={onReanalyze} disabled={isReanalyzing}>
            {isReanalyzing ? "YZ yeniden çalışıyor..." : "YZ yanıtını yeniden üret"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function InsightBadge({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
