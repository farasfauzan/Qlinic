export function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-clinical ring-sky-100",
    navy: "bg-slate-100 text-navy ring-slate-200",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100"
  };

  return (
    <div className="app-card rounded-xl p-5 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-navy">{value}</p>
        </div>
        {Icon ? (
          <div className={`rounded-xl p-3 ring-1 ${tones[tone] || tones.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-4 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
