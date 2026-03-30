import { useEffect, useState } from "react";

import { AppLoadingScreen } from "./components/AppLoadingScreen";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
import { Layout } from "./components/Layout";
import {
  DEMO_CREDENTIALS,
  addAgentNote,
  askAIAssistant,
  clearStoredSession,
  createTicket,
  fetchCurrentUser,
  fetchSummary,
  fetchTicket,
  fetchTickets,
  getStoredToken,
  getTicketEventsWebSocketUrl,
  login,
  reanalyzeTicket,
  resolveTicket,
} from "./lib/api";
import { getDefaultRouteForRole, getRoute, isRouteAllowed, navigate } from "./lib/router";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AgentDashboardPage } from "./pages/AgentDashboardPage";
import { CreateTicketPage } from "./pages/CreateTicketPage";
import { CustomerDashboardPage } from "./pages/CustomerDashboardPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  function resetWorkspace() {
    setTickets([]);
    setSummary(null);
    setSelectedTicketId(null);
    setSelectedTicket(null);
    setAssistantMessages([]);
    setIsAssistantOpen(false);
  }

  function pushNotice(nextNotice) {
    setNotice(nextNotice);
  }

  function handleApiFailure(err, fallbackMessage) {
    console.error(err);
    if (err?.status === 401) {
      clearStoredSession();
      setCurrentUser(null);
      resetWorkspace();
      setError("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
      navigate("/login");
      return;
    }
    setError(err?.message || fallbackMessage);
  }

  async function bootstrapSession() {
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setIsAuthLoading(false);
      navigate("/login");
      return;
    }

    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      setError("");
    } catch (err) {
      clearStoredSession();
      setCurrentUser(null);
      navigate("/login");
      handleApiFailure(err, "Oturum doğrulanamadı.");
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function loadDashboard() {
    if (!currentUser) return;
    setIsDashboardLoading(true);
    try {
      const [ticketsData, summaryData] = await Promise.all([fetchTickets(), fetchSummary()]);
      setTickets(ticketsData);
      setSummary(summaryData);
      setError("");
    } catch (err) {
      handleApiFailure(err, "Veriler yüklenemedi.");
    } finally {
      setIsDashboardLoading(false);
    }
  }

  async function loadTicketDetail(ticketId) {
    if (!currentUser || !ticketId) {
      setSelectedTicket(null);
      return;
    }

    setIsTicketLoading(true);
    try {
      const ticket = await fetchTicket(ticketId);
      setSelectedTicket(ticket);
      setError("");
    } catch (err) {
      handleApiFailure(err, "Talep detayı yüklenemedi.");
    } finally {
      setIsTicketLoading(false);
    }
  }

  useEffect(() => {
    function syncRoute() {
      setRoute(getRoute());
    }

    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    bootstrapSession().catch((err) => handleApiFailure(err, "Oturum başlatılamadı."));
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser) {
      if (route.name !== "login") {
        navigate("/login");
      }
      return;
    }
    if (route.name === "login") {
      navigate(getDefaultRouteForRole(currentUser.role));
    }
    if (!isRouteAllowed(route.name, currentUser.role)) {
      navigate(getDefaultRouteForRole(currentUser.role));
    }
  }, [currentUser, isAuthLoading, route.name]);

  useEffect(() => {
    if (!currentUser || route.name === "login") return;

    loadDashboard();

    const interval = window.setInterval(() => {
      loadDashboard();
      if (selectedTicketId) {
        loadTicketDetail(selectedTicketId);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [currentUser, route.name, selectedTicketId]);

  useEffect(() => {
    if (!currentUser || route.name === "login") return;

    const socket = new WebSocket(getTicketEventsWebSocketUrl());
    socket.onmessage = async () => {
      await loadDashboard();
      if (selectedTicketId) {
        await loadTicketDetail(selectedTicketId);
      }
    };
    return () => socket.close();
  }, [currentUser, route.name, selectedTicketId]);

  useEffect(() => {
    if (!currentUser || route.name === "login") return;

    if (!tickets.length) {
      setSelectedTicketId(null);
      setSelectedTicket(null);
      return;
    }

    const exists = tickets.some((ticket) => ticket.id === selectedTicketId);
    if (!selectedTicketId || !exists) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId, currentUser, route.name]);

  useEffect(() => {
    if (!currentUser || route.name === "login" || !selectedTicketId) return;
    loadTicketDetail(selectedTicketId);
  }, [currentUser, route.name, selectedTicketId]);

  useEffect(() => {
    setAssistantMessages([]);
  }, [selectedTicketId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function handleSelectTicket(ticket) {
    setSelectedTicketId(ticket.id);
    setSelectedTicket((current) =>
      current?.id === ticket.id
        ? current
        : {
            ...ticket,
            events: [],
            similar_tickets: [],
            sla_status: ticket.resolved_at ? "resolved" : "active",
          },
    );
  }

  async function handleLogin(credentials) {
    setIsSubmitting(true);
    try {
      const auth = await login(credentials);
      setCurrentUser(auth.user);
      setError("");
      pushNotice({
        variant: "success",
        title: "Oturum açıldı",
        description: `${auth.user.name} olarak giriş yapıldı.`,
      });
      navigate("/");
      return true;
    } catch (err) {
      handleApiFailure(err, "Giriş yapılamadı.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearStoredSession();
    setCurrentUser(null);
    resetWorkspace();
    setError("");
    navigate("/login");
  }

  async function handleCreateTicket(form) {
    setIsSubmitting(true);
    try {
      const created = await createTicket(form);
      await loadDashboard();
      setSelectedTicketId(created.id);
      setIsAssistantOpen(false);
      pushNotice({
        variant: "success",
        title: "Talep oluşturuldu",
        description: "Talep kaydedildi. Yapay zeka analizi arka planda devam ediyor.",
      });
      navigate("/");
      return true;
    } catch (err) {
      handleApiFailure(err, "Talep oluşturulamadı.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResolve(ticketId) {
    try {
      await resolveTicket(ticketId);
      await loadDashboard();
      if (selectedTicketId === ticketId) {
        await loadTicketDetail(ticketId);
      }
      pushNotice({
        variant: "success",
        title: "Talep çözüldü olarak işaretlendi",
        description: "Durum güncellendi ve panel yenilendi.",
      });
    } catch (err) {
      handleApiFailure(err, "Talep durumu güncellenemedi.");
    }
  }

  async function handleAddNote(body) {
    if (!selectedTicketId || !currentUser) return false;
    setIsAddingNote(true);
    try {
      await addAgentNote(selectedTicketId, {
        author_name: currentUser.name,
        body,
      });
      await loadDashboard();
      await loadTicketDetail(selectedTicketId);
      setError("");
      pushNotice({
        variant: "success",
        title: "İç not eklendi",
        description: "Not talep zaman akışına işlendi.",
      });
      return true;
    } catch (err) {
      handleApiFailure(err, "İç not eklenemedi.");
      return false;
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleReanalyze() {
    if (!selectedTicketId) return;
    setIsReanalyzing(true);
    try {
      await reanalyzeTicket(selectedTicketId);
      setError("");
      pushNotice({
        variant: "info",
        title: "Yeniden analiz başlatıldı",
        description: "Yapay zeka bu talep için yeni bir değerlendirme oluşturacak.",
      });
    } catch (err) {
      handleApiFailure(err, "Yapay zeka yeniden başlatılamadı.");
    } finally {
      setIsReanalyzing(false);
    }
  }

  async function handleAskAssistant(question) {
    if (!selectedTicketId || !question.trim()) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };
    setAssistantMessages((current) => [...current, userMessage]);
    setIsAssistantLoading(true);

    try {
      const response = await askAIAssistant(selectedTicketId, { question });
      setAssistantMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: response.answer,
        },
      ]);
      setError("");
    } catch (err) {
      handleApiFailure(err, "Yapay zeka yardımcısı yanıt üretemedi.");
    } finally {
      setIsAssistantLoading(false);
    }
  }

  if (isAuthLoading) {
    return <AppLoadingScreen />;
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onDemoLogin={(role) => handleLogin(DEMO_CREDENTIALS[role])}
        isSubmitting={isSubmitting}
        error={error}
      />
    );
  }

  let content = null;
  if (route.name === "analytics" && currentUser.role === "agent") {
    content = <AnalyticsPage summary={summary} />;
  } else if (route.name === "create") {
    content = <CreateTicketPage onSubmit={handleCreateTicket} isSubmitting={isSubmitting} error={error} currentUser={currentUser} notice={notice} />;
  } else if (currentUser.role === "agent") {
    content = (
      <AgentDashboardPage
        summary={summary}
        tickets={tickets}
        selectedTicket={selectedTicket}
        selectedTicketId={selectedTicketId}
        isDashboardLoading={isDashboardLoading}
        isTicketLoading={isTicketLoading}
        onResolve={handleResolve}
        onSelectTicket={handleSelectTicket}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onReanalyze={handleReanalyze}
        isReanalyzing={isReanalyzing}
        onAddNote={handleAddNote}
        isAddingNote={isAddingNote}
        error={error}
        notice={notice}
      />
    );
  } else {
    content = (
      <CustomerDashboardPage
        summary={summary}
        tickets={tickets}
        selectedTicket={selectedTicket}
        selectedTicketId={selectedTicketId}
        isDashboardLoading={isDashboardLoading}
        isTicketLoading={isTicketLoading}
        onSelectTicket={handleSelectTicket}
        error={error}
        notice={notice}
      />
    );
  }

  return (
    <>
      <Layout routeName={route.name} user={currentUser} onLogout={handleLogout}>
        {content}
      </Layout>
      {currentUser.role === "agent" ? (
        <AIAssistantPanel
          isOpen={isAssistantOpen}
          ticket={selectedTicket}
          messages={assistantMessages}
          isLoading={isAssistantLoading}
          onClose={() => setIsAssistantOpen(false)}
          onSend={handleAskAssistant}
        />
      ) : null}
    </>
  );
}
