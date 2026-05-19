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
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <SearchX className="mx-auto mb-3 h-9 w-9 text-slate-400" />
      <h3 className="font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
