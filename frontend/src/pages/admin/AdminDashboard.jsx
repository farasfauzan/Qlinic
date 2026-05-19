import { CalendarDays, Clock3, Stethoscope, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatCard } from "../../components/StatCard";
import { DashboardLayout } from "../../layouts/DashboardLayout";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await api.get("/report/summary");
        setSummary(response.data);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  return (
    <DashboardLayout title="Dashboard Admin" subtitle="Ringkasan operasional klinik hari ini.">
      {loading ? (
        <LoadingState />
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total Pasien" value={summary.total_pasien} />
            <StatCard icon={Stethoscope} label="Total Dokter" value={summary.total_dokter} tone="navy" />
            <StatCard icon={CalendarDays} label="Booking Hari Ini" value={summary.total_booking_hari_ini} tone="green" />
            <StatCard icon={Clock3} label="Antrean Aktif" value={summary.antrean_aktif} tone="amber" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-navy">Booking Berdasarkan Status</h2>
              <div className="space-y-3">
                {summary.booking_by_status.map((item) => (
                  <div key={item.status_booking} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <span className="font-semibold text-navy">{item.status_booking}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-clinical">
                      {item.total}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-navy">Dokter Terbanyak Booking</h2>
              <div className="space-y-3">
                {summary.top_doctors.map((doctor, index) => (
                  <div key={doctor.dokter_nama} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-navy">
                        {index + 1}. {doctor.dokter_nama}
                      </p>
                      <p className="text-sm text-slate-500">{doctor.spesialisasi}</p>
                    </div>
                    <span className="font-bold text-clinical">{doctor.total_booking}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <EmptyState title="Ringkasan belum tersedia" />
      )}
    </DashboardLayout>
  );
}
