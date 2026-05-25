import { useEffect, useState } from "react";

export function ConfirmDialog({
  title,
  description,
  details = [],
  confirmLabel,
  cancelLabel,
  tone = "neutral",
  loading = false,
  onConfirm,
  onCancel
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!show) setShow(true);
  }, [details]);

  const toneStyles = {
    neutral: "bg-slate-50 text-slate-700",
    warning: "bg-orange-50 text-orange-700",
    danger: "bg-rose-50 text-rose-700"
  };

  const borderColors = {
    neutral: "border-slate-200",
    warning: "border-orange-200",
    danger: "border-rose-200"
  };

  const buttonColors = {
    neutral: "bg-[#0a4778] text-white hover:bg-[#073e69]",
    warning: "bg-orange-600 text-white hover:bg-orange-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-xl border ${borderColors[tone]} bg-white p-6 shadow-xl`}>
        <h3 className={`text-lg font-bold ${toneStyles[tone].split(" ")[1]}`}>{title}</h3>
        {description && <p className={`mt-2 text-sm ${toneStyles[tone].split(" ")[1]}`}>{description}</p>}
        {details.length > 0 && (
          <div className="mt-4 space-y-2">
            {details.map((item, index) => (
              <div key={index} className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-medium text-slate-600">{item.label}</span>
                <span className="text-sm text-slate-400">{item.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${buttonColors[tone]} disabled:opacity-70`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
