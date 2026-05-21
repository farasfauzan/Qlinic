import {
  Activity,
  BarChart3,
  CalendarDays,
  Heart,
  Stethoscope,
  Timer,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatCard } from "../../components/StatCard";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate } from "../../utils";

const KONSULTASI_FEE = 75000;
const RATA_DURASI_MENIT = 30;

const statusTone = {
  Pending: "bg-amber-100 text-amber-700 ring-amber-200",
  Done: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 ring-rose-200"
};

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const response = await api.get("/report/bookings");
        setReport(response.data);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  const stats = useMemo(() => {
    if (!report) return null;

    const dailyRows = (report.total_booking_per_hari || []).map((row) => ({
      tanggal: row.tanggal_kunjungan,
      total: Number(row.total_booking) || 0
    }));
    const totalBooking = dailyRows.reduce((sum, row) => sum + row.total, 0);

    const statusMap = (report.booking_by_status || []).reduce((acc, row) => {
      acc[row.status_booking] = Number(row.total) || 0;
      return acc;
    }, {});

    const done = statusMap.Done || 0;
    const cancelled = statusMap.Cancelled || 0;
    const pending = statusMap.Pending || 0;
    const totalAll = done + cancelled + pending;

    const completionRate = done + cancelled ? (done / (done + cancelled)) * 100 : 0;
    const estimasiPendapatan = done * KONSULTASI_FEE;
    const estimasiJamKonsultasi = (done * RATA_DURASI_MENIT) / 60;

    const topDoctors = (report.dokter_terpopuler || []).map((row) => ({
      nama: row.dokter_nama,
      spesialisasi: row.spesialisasi,
      total: Number(row.total_booking) || 0
    }));

    return {
      dailyRows,
      totalBooking,
      statusMap,
      done,
      cancelled,
      pending,
      totalAll,
      completionRate,
      estimasiPendapatan,
      estimasiJamKonsultasi,
      topDoctors
    };
  }, [report]);

  return (
    <DashboardLayout
      title="Report & Analytics"
      subtitle="Pantau performa klinik dari tren booking, status, hingga estimasi operasional."
    >
      {loading ? (
        <LoadingState />
      ) : !report || !stats ? (
        <EmptyState title="Report belum tersedia" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Estimasi Pendapatan"
              value={formatRupiah(stats.estimasiPendapatan)}
              hint={`Asumsi tarif konsultasi ${formatRupiah(KONSULTASI_FEE)}`}
              tone="green"
            />
            <StatCard
              icon={Heart}
              label="Tingkat Penyelesaian"
              value={`${stats.completionRate.toFixed(1)}%`}
              hint={`${stats.done} dari ${stats.done + stats.cancelled} kunjungan terselesaikan`}
              tone="amber"
            />
            <StatCard
              icon={CalendarDays}
              label="Booking 14 Hari"
              value={stats.totalBooking}
              hint="Tren kunjungan terbaru"
              tone="blue"
            />
            <StatCard
              icon={Timer}
              label="Total Waktu Konsultasi"
              value={`${stats.estimasiJamKonsultasi.toFixed(1)} jam`}
              hint={`Estimasi ${RATA_DURASI_MENIT} menit per pasien selesai`}
              tone="navy"
            />
          </div>

          <section className="app-card rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                  <Activity className="h-5 w-5" />
                  Tren Booking 14 Hari
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Distribusi jumlah booking per tanggal kunjungan.
                </p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-clinical">
                {stats.dailyRows.length} titik data
              </span>
            </div>

            <div className="mt-5">
              {stats.dailyRows.length ? (
                <TrendChart data={[...stats.dailyRows].reverse()} />
              ) : (
                <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Belum ada data booking untuk ditampilkan.
                </p>
              )}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="app-card rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                <BarChart3 className="h-5 w-5" />
                Booking Berdasarkan Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">Perbandingan status kunjungan.</p>

              <div className="mt-4 space-y-3">
                {(["Pending", "Done", "Cancelled"]).map((status) => {
                  const count = stats.statusMap[status] || 0;
                  const ratio = stats.totalAll ? (count / stats.totalAll) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone[status]}`}
                        >
                          {status}
                        </span>
                        <span className="font-semibold text-navy">
                          {count} <span className="text-xs text-slate-400">({ratio.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${barTone(status)}`}
                          style={{ width: `${ratio.toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="app-card rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                <Stethoscope className="h-5 w-5" />
                Performa Dokter
              </h2>
              <p className="mt-1 text-sm text-slate-500">Dokter dengan kunjungan terbanyak.</p>

              <div className="mt-4 space-y-3">
                {stats.topDoctors.length ? (
                  stats.topDoctors.map((doctor, index) => {
                    const max = stats.topDoctors[0]?.total || 1;
                    const ratio = max ? (doctor.total / max) * 100 : 0;
                    return (
                      <div key={`${doctor.nama}-${index}`}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy">
                              {index + 1}. {doctor.nama || "(Tanpa nama)"}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {doctor.spesialisasi || "Dokter"}
                            </p>
                          </div>
                          <span className="shrink-0 font-semibold text-navy">{doctor.total}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-clinical"
                            style={{ width: `${ratio.toFixed(1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Belum ada data performa dokter.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="app-card rounded-2xl p-5">
            <h2 className="text-base font-bold text-navy">Rincian Booking per Hari</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tabel rinci tren 14 hari terakhir untuk audit operasional.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2">Tanggal</th>
                    <th className="py-2 text-right">Total Booking</th>
                    <th className="py-2 text-right">Estimasi Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyRows.length ? (
                    stats.dailyRows.map((row) => (
                      <tr key={row.tanggal} className="border-b border-slate-100">
                        <td className="py-2.5 font-semibold text-navy">{formatDate(row.tanggal)}</td>
                        <td className="py-2.5 text-right">{row.total}</td>
                        <td className="py-2.5 text-right text-slate-600">
                          {formatRupiah(row.total * KONSULTASI_FEE)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-sm text-slate-500">
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function TrendChart({ data }) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 30, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...data.map((row) => row.total));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((row, index) => {
    const x = padding.left + stepX * index;
    const y = padding.top + innerH - (row.total / max) * innerH;
    return { x, y, ...row };
  });

  const path = points.length
    ? points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ")
    : "";

  const areaPath = points.length
    ? `${path} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`
    : "";

  const yTicks = Array.from({ length: 4 }, (_, index) => Math.round((max / 3) * index));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full min-w-[480px]"
        role="img"
        aria-label="Tren booking 14 hari"
      >
        <defs>
          <linearGradient id="qlinic-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a4778" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0a4778" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = padding.top + innerH - (tick / max) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={padding.left + innerW}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {tick}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#qlinic-trend)" /> : null}
        {path ? (
          <path d={path} fill="none" stroke="#0a4778" strokeWidth="2.5" strokeLinejoin="round" />
        ) : null}

        {points.map((point, index) => (
          <g key={`${point.tanggal}-${index}`}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="#0a4778" />
            <title>{`${formatDate(point.tanggal)}: ${point.total} booking`}</title>
          </g>
        ))}

        {points.map((point, index) => {
          const showLabel = index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2);
          if (!showLabel) return null;
          return (
            <text
              key={`lbl-${point.tanggal}-${index}`}
              x={point.x}
              y={padding.top + innerH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatShortDate(point.tanggal)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function barTone(status) {
  if (status === "Done") return "bg-emerald-500";
  if (status === "Cancelled") return "bg-rose-500";
  return "bg-amber-500";
}

function formatRupiah(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short"
  }).format(date);
}
