import { Bot, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

const QUICK_PROMPTS = ["Sorunu özetle", "Nasıl yanıt vermeliyim?", "Bu talep acil mi?", "Öncelik neden bu seviyede?"];

export function AIAssistantPanel({ isOpen, ticket, messages, isLoading, onClose, onSend }) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setDraft("");
    }
  }, [isOpen]);

  const disabled = !ticket || isLoading;

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.trim() || disabled) return;
    onSend(draft.trim());
    setDraft("");
  }

  const title = useMemo(() => {
    if (!ticket) return "YZ Yardımcısı";
    return `YZ Yardımcısı · #${ticket.id}`;
  }, [ticket]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm">
      <button className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Kapat" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Assistant</span>
            </div>
            <h3 className="font-heading text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">YZ’den özet, yanıt önerisi veya öncelik açıklaması isteyin.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-6 py-4">
          {QUICK_PROMPTS.map((prompt) => (
            <Button key={prompt} variant="secondary" size="sm" disabled={disabled} onClick={() => onSend(prompt)}>
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 scrollbar-subtle">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="font-medium text-slate-900">Yapay zeka yardımcısı hazır</p>
              <p className="mt-1 text-sm text-slate-500">Seçili talep için kısa komutları kullanabilir veya kendi sorunu yazabilirsiniz.</p>
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`max-w-[92%] rounded-2xl px-4 py-3 ${message.role === "assistant" ? "border border-slate-200 bg-white" : "ml-auto bg-slate-900 text-white"}`}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] opacity-70">
                {message.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : null}
                <span>{message.role === "assistant" ? "Yapay Zeka" : "Siz"}</span>
              </div>
              {message.role === "assistant" ? <AnimatedText text={message.content} /> : <p className="text-sm leading-6">{message.content}</p>}
            </div>
          ))}

          {isLoading ? (
            <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                <Bot className="h-3.5 w-3.5" />
                <span>Yapay Zeka</span>
              </div>
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
              </div>
            </div>
          ) : null}
        </div>

        <form className="border-t border-slate-200 px-6 py-4" onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Örn: müşteriye nasıl yanıt vermeliyim?" disabled={disabled} />
            <Button type="submit" disabled={disabled || !draft.trim()}>
              Gönder
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function AnimatedText({ text }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, 12);
    return () => window.clearInterval(interval);
  }, [text]);

  return <p className="text-sm leading-6 text-slate-700">{visibleText}</p>;
}
