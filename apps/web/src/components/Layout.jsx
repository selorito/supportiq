import { BarChart3, LayoutDashboard, LogOut, Plus, ShieldCheck } from "lucide-react";

import { formatLabel } from "../lib/format";
import { navigate } from "../lib/router";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function Layout({ routeName, user, onLogout, children }) {
  const navItems = [{ key: "dashboard", label: user?.role === "agent" ? "Panel" : "Taleplerim", icon: LayoutDashboard, path: "/" }];

  if (user?.role === "agent") {
    navItems.push({ key: "analytics", label: "Analitik", icon: BarChart3, path: "/analytics" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="page-shell flex min-h-[72px] items-center justify-between gap-4">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">S</div>
            <div className="hidden sm:block">
              <p className="font-heading text-sm font-semibold text-slate-900">SupportIQ</p>
              <p className="text-xs text-slate-500">Yapay zeka destek operasyonları</p>
            </div>
          </button>

          <div className="flex flex-1 items-center justify-end gap-3">
            <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      routeName === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => navigate("/create")}>
              <Plus className="h-4 w-4" />
              Yeni Talep
            </Button>

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 lg:flex">
              <div className="space-y-0.5 text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Badge variant="info" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {formatLabel(user?.role)}
              </Badge>
            </div>

            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Çıkış Yap">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="page-shell py-6 sm:py-8">{children}</main>
    </div>
  );
}
