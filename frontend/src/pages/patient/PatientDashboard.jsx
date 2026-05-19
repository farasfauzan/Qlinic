import { CalendarDays, ClipboardList, Hash, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime } from "../../utils";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingResponse, recordResponse] = await Promise.all([
          api.get("/pasien/bookings"),
          api.get("/pasien/medical-records")
        ]);
        setBookings(bookingResponse.data);
        setRecords(recordResponse.data);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status_booking === "Pending")
        .sort((a, b) => new Date(a.tanggal_kunjungan) - new Date(b.tanggal_kunjungan))[0],
    [bookings]
  );

  return (
    <DashboardLayout
      title={`Halo, ${user?.nama || "Pasien"}`}
      subtitle="Pantau janji temu, antrean, dan rekam medis Anda."
    >
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={CalendarDays}
              label="Janji Mendatang"
              value={bookings.filter((item) => item.status_booking === "Pending").length}
              hint={upcoming ? `${formatDate(upcoming.tanggal_kunjungan)} pukul ${formatTime(upcoming.jam_slot)}` : "Tidak ada booking aktif"}
            />
            <StatCard
              icon={Hash}
              label="Nomor Antrean"
              value={upcoming ? `#${upcoming.nomor_antrean}` : "-"}
              hint={upcoming ? upcoming.dokter_nama : "Buat booking baru untuk mendapat antrean"}
              tone="amber"
            />
            <StatCard
              icon={ClipboardList}
              label="Riwayat Kunjungan"
              value={records.length}
              hint="Rekam medis tersimpan"
              tone="green"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="app-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-navy">Ringkasan Janji Temu</h2>
                <Link
                  to="/patient/find-doctor"
                  className="inline-flex items-center gap-2 rounded-lg bg-clinical px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  <Search className="h-4 w-4" />
                  Cari Dokter
                </Link>
              </div>
              {upcoming ? (
                <div className="rounded-xl bg-sky-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Booking berikutnya</p>
                      <h3 className="mt-1 text-xl font-bold text-navy">{upcoming.dokter_nama}</h3>
                      <p className="text-sm text-slate-600">{upcoming.spesialisasi}</p>
                    </div>
                    <StatusBadge status={upcoming.status_booking} />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs text-slate-500">Tanggal</p>
                      <p className="font-semibold text-navy">{formatDate(upcoming.tanggal_kunjungan)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs text-slate-500">Jam</p>
                      <p className="font-semibold text-navy">{formatTime(upcoming.jam_slot)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs text-slate-500">Antrean</p>
                      <p className="font-semibold text-navy">#{upcoming.nomor_antrean}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Belum ada janji aktif"
                  description="Cari dokter dan buat appointment sesuai jadwal praktik."
                />
              )}
            </section>

            <section className="app-card rounded-2xl p-5">
              <h2 className="mb-4 text-lg font-bold text-navy">Riwayat Terbaru</h2>
              {records.length ? (
                <div className="space-y-3">
                  {records.slice(0, 3).map((record) => (
                    <div key={record.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start gap-3">
                        <UserRound className="mt-1 h-5 w-5 text-clinical" />
                        <div>
                          <p className="font-semibold text-navy">{record.dokter_nama}</p>
                          <p className="text-sm text-slate-500">{formatDate(record.tanggal_periksa)}</p>
                          <p className="mt-2 text-sm text-slate-600">{record.diagnosa}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Rekam medis kosong" description="Data akan muncul setelah pemeriksaan selesai." />
              )}
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
