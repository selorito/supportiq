const ROUTE_TABLE = {
  "/": { name: "dashboard", allow: ["customer", "agent"] },
  "/login": { name: "login", allow: ["guest", "customer", "agent"] },
  "/create": { name: "create", allow: ["customer", "agent"] },
  "/analytics": { name: "analytics", allow: ["agent"] },
};

export function getRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return ROUTE_TABLE[hash] ?? ROUTE_TABLE["/"];
}

export function navigate(path) {
  window.location.hash = path;
}

export function getDefaultRouteForRole(role) {
  if (!role) return "/login";
  return "/";
}

export function isRouteAllowed(routeName, role) {
  const effectiveRole = role ?? "guest";
  return Object.values(ROUTE_TABLE).some((route) => route.name === routeName && route.allow.includes(effectiveRole));
}
