import { Card, CardContent } from "./ui/card";

export function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-2 p-6 text-center">
          <p className="font-heading text-lg font-semibold text-slate-900">SupportIQ hazırlanıyor</p>
          <p className="text-sm text-slate-500">Oturum ve çalışma alanı yükleniyor.</p>
        </CardContent>
      </Card>
    </div>
  );
}
