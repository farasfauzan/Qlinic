export function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function formatTime(timeString) {
  if (!timeString) return "-";
  const [hour, minute] = timeString.split(":");
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? "Sore" : "Pagi";
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
  return `${displayHour}:${minute} ${ampm}`;
}

export function timeSlots() {
  return [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30"
  ];
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
