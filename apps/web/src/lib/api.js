const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const TOKEN_STORAGE_KEY = "supportiq_access_token";

export const DEMO_CREDENTIALS = {
  customer: { email: "customer@supportiq.dev", password: "demo123" },
  agent: { email: "agent@supportiq.dev", password: "demo123" },
};

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `API request failed for ${path}`;
    try {
      const payload = await response.json();
      message = payload.detail ?? message;
    } catch {
      // Ignore non-JSON error bodies.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearStoredSession() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function login(payload) {
  const data = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  window.localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
  return data;
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

export function fetchTickets() {
  return request("/tickets");
}

export function fetchTicket(ticketId) {
  return request(`/tickets/${ticketId}`);
}

export function fetchSummary() {
  return request("/dashboard/summary");
}

export function createTicket(payload) {
  return request("/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function resolveTicket(ticketId) {
  return request(`/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "resolved" }),
  });
}

export function reanalyzeTicket(ticketId) {
  return request(`/tickets/${ticketId}/reanalyze`, {
    method: "POST",
  });
}

export function askAIAssistant(ticketId, payload) {
  return request(`/tickets/${ticketId}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function seedDemoData() {
  return request("/dashboard/seed", { method: "POST" });
}

export function addAgentNote(ticketId, payload) {
  return request(`/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getTicketEventsWebSocketUrl() {
  const baseUrl = new URL(API_BASE_URL);
  const protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = new URL(`${protocol}//${baseUrl.host}/ws/tickets`);
  const token = getStoredToken();
  if (token) {
    socketUrl.searchParams.set("token", token);
  }
  return socketUrl.toString();
}
