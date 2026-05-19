import { Loader2, SearchX } from "lucide-react";

export function LoadingState({ label = "Memuat data...", fullScreen = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-slate-600 ${
        fullScreen ? "min-h-screen" : "py-10"
      }`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-clinical" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = "Belum ada data", description = "Data akan tampil di sini." }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
