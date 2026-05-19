import { BarChart3, CalendarDays, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatCard } from "../../components/StatCard";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate } from "../../utils";

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

  const totalBooking = report?.total_booking_per_hari?.reduce(
    (sum, item) => sum + Number(item.total_booking),
    0
  );

  return (
    <DashboardLayout title="Report & Analytics" subtitle="Statistik booking sederhana untuk operasional klinik.">
      {loading ? (
        <LoadingState />
      ) : report ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={CalendarDays} label="Booking 14 Hari" value={totalBooking || 0} />
            <StatCard icon={BarChart3} label="Status Aktif" value={report.booking_by_status?.length || 0} tone="green" />
            <StatCard icon={Stethoscope} label="Dokter Dipantau" value={report.dokter_terpopuler?.length || 0} tone="navy" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ReportTable
              title="Total Booking per Hari"
              rows={report.total_booking_per_hari}
              columns={[
                ["tanggal_kunjungan", "Tanggal", (value) => formatDate(value)],
                ["total_booking", "Total"]
              ]}
            />
            <ReportTable
              title="Booking Berdasarkan Status"
              rows={report.booking_by_status}
              columns={[
                ["status_booking", "Status"],
                ["total", "Total"]
              ]}
            />
            <ReportTable
              title="Dokter dengan Booking Terbanyak"
              rows={report.dokter_terpopuler}
              columns={[
                ["dokter_nama", "Dokter"],
                ["total_booking", "Total"]
              ]}
            />
          </div>
        </div>
      ) : (
        <EmptyState title="Report belum tersedia" />
      )}
    </DashboardLayout>
  );
}

function ReportTable({ title, rows = [], columns }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-navy">{title}</h2>
      <div className="space-y-2">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              {columns.map(([key, label, formatter]) => (
                <div key={key}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-semibold text-navy">{formatter ? formatter(row[key]) : row[key]}</p>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Belum ada data.</p>
        )}
      </div>
    </section>
  );
}
