export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

export function toInputDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

export function statusClass(status) {
  const map = {
    Pending: "bg-amber-100 text-amber-800 ring-amber-200",
    Done: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    Cancelled: "bg-rose-100 text-rose-800 ring-rose-200"
  };
  return map[status] || "bg-slate-100 text-slate-700 ring-slate-200";
}

export const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];
