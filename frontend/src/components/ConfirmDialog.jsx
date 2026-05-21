import { AlertTriangle, Info, X } from "lucide-react";

const toneStyles = {
  danger: {
    panel: "border-rose-100 bg-rose-50 text-rose-700",
    button: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-300",
    icon: AlertTriangle
  },
  warning: {
    panel: "border-amber-100 bg-amber-50 text-amber-700",
    button: "bg-[#073e69] text-white hover:bg-[#052f50] focus-visible:outline-sky-300",
    icon: AlertTriangle
  },
  info: {
    panel: "border-sky-100 bg-sky-50 text-[#0a4778]",
    button: "bg-[#073e69] text-white hover:bg-[#052f50] focus-visible:outline-sky-300",
    icon: Info
  }
};

export function ConfirmDialog({
  title,
  description,
  details = [],
  confirmLabel = "Lanjutkan",
  cancelLabel = "Kembali",
  tone = "warning",
  loading = false,
  onConfirm,
  onCancel
}) {
  const styles = toneStyles[tone] || toneStyles.warning;
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-soft ring-1 ring-white/40">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styles.panel}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#12385d]">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Tutup konfirmasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {details.length ? (
          <dl className="grid gap-3 px-5 py-4">
            {details.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#12385d]">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="grid gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-12 rounded-xl px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${styles.button}`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
