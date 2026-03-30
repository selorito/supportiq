import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { formatLabel } from "../lib/format";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { EmptyState } from "./EmptyState";

export function TicketList({ tickets, selectedTicketId, onSelectTicket, isLoading }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.analysis?.category).filter(Boolean))),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        !searchQuery.trim() ||
        `${ticket.subject} ${ticket.customer_name} ${ticket.message}`.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.analysis?.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || ticket.analysis?.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <div>
          <CardTitle>Talep Kuyruğu</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Kuyruğu filtreleyin, doğru talebi açın ve operasyonu tek ekrandan yönetin.</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,180px))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Talep ara" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tüm durumlar</option>
            <option value="new">Yeni</option>
            <option value="triaged">Önceliklendirildi</option>
            <option value="resolved">Çözüldü</option>
          </Select>
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">Tüm öncelikler</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </Select>
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {formatLabel(category)}
              </option>
            ))}
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[minmax(0,2fr)_120px_150px_140px_110px] gap-3 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 lg:grid">
            <span>Talep</span>
            <span>Öncelik</span>
            <span>Kategori</span>
            <span>Durum</span>
            <span>SLA</span>
          </div>

          <div className="max-h-[720px] overflow-y-auto bg-white scrollbar-subtle">
            {isLoading ? (
              <EmptyState
                compact
                title="Talep kuyruğu yükleniyor"
                description="SupportIQ kuyruk verisini ve yapay zeka durumlarını hazırlıyor."
              />
            ) : null}
            {!isLoading && tickets.length === 0 ? (
              <EmptyState
                compact
                title="Henüz talep yok"
                description="Yeni bir müşteri isteği geldiğinde SupportIQ bunu otomatik olarak analiz edip önceliklendirecek."
              />
            ) : null}
            {!isLoading && tickets.length > 0 && filteredTickets.length === 0 ? (
              <EmptyState compact title="Sonuç bulunamadı" description="Bu filtrelerle eşleşen talep bulunamadı." />
            ) : null}

            {!isLoading &&
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => onSelectTicket(ticket)}
                  className={`grid w-full gap-3 border-t border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[minmax(0,2fr)_120px_150px_140px_110px] ${
                    ticket.id === selectedTicketId ? "bg-brand-50/60" : "bg-white"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{ticket.subject}</p>
                      <p className="text-sm text-slate-500">{ticket.customer_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {ticket.analysis ? (
                        <Badge variant="info" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          YZ işlendi
                        </Badge>
                      ) : (
                        <Badge variant="secondary">YZ analiz ediyor</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center lg:justify-start">
                    <Badge variant={getPriorityVariant(ticket.analysis?.priority)}>{formatLabel(ticket.analysis?.priority ?? "pending")}</Badge>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">{formatLabel(ticket.analysis?.category ?? "pending")}</div>
                  <div className="flex items-center">
                    <Badge variant={getStatusVariant(ticket.status)}>{formatLabel(ticket.status)}</Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={getSlaVariant(ticket)}>{formatLabel(getSlaLabel(ticket))}</Badge>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityVariant(priority) {
  if (priority === "high") return "danger";
  if (priority === "low") return "secondary";
  return "warning";
}

function getStatusVariant(status) {
  if (status === "resolved") return "success";
  if (status === "triaged") return "info";
  return "secondary";
}

function getSlaLabel(ticket) {
  if (ticket.resolved_at) return "resolved";
  if (ticket.resolution_due_at && new Date(ticket.resolution_due_at) < new Date()) return "breached";
  return "active";
}

function getSlaVariant(ticket) {
  const status = getSlaLabel(ticket);
  if (status === "breached") return "danger";
  if (status === "resolved") return "success";
  return "warning";
}
