import { CalendarClock, CheckCircle2, ClipboardPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime, toInputDate } from "../../utils";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    try {
      const response = await api.get(`/dokter/me/bookings?tanggal=${toInputDate()}`);
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const pending = useMemo(
    () => bookings.filter((booking) => booking.status_booking === "Pending"),
    [bookings]
  );

  async function markDone(id) {
    try {
      await api.put(`/booking/${id}/status`, { status_booking: "Done" });
      toast.success("Booking ditandai selesai");
      await loadBookings();
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui status");
    }
  }

  return (
    <DashboardLayout title={`Dashboard ${user?.nama || "Dokter"}`} subtitle="Jadwal praktik dan antrean pasien hari ini.">
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={Users} label="Pasien Hari Ini" value={bookings.length} hint={formatDate(toInputDate())} />
            <StatCard icon={CalendarClock} label="Jadwal Praktik" value="Hari ini" hint={user?.jadwal_praktik || "-"} tone="navy" />
            <StatCard icon={CheckCircle2} label="Antrean Aktif" value={pending.length} hint="Status Pending" tone="green" />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Daftar Pasien Booking</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-clinical">
                {bookings.length} pasien
              </span>
            </div>
            {bookings.length ? (
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-navy">{booking.pasien_nama}</p>
                      <p className="text-sm text-slate-500">
                        Antrean #{booking.nomor_antrean} - {formatTime(booking.jam_slot)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={booking.status_booking} />
                      <button
                        type="button"
                        onClick={() => markDone(booking.id)}
                        disabled={booking.status_booking !== "Pending"}
                        className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ClipboardPlus className="h-4 w-4" />
                        Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Tidak ada booking hari ini" description="Antrean pasien akan tampil saat ada booking." />
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
