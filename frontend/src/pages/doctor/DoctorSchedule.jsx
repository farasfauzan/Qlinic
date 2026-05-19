import { CheckCircle2, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime, toInputDate } from "../../utils";

export default function DoctorSchedule() {
  const [tanggal, setTanggal] = useState(toInputDate());
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tanggal) params.set("tanggal", tanggal);
      if (status) params.set("status", status);
      const response = await api.get(`/dokter/me/bookings?${params.toString()}`);
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [tanggal, status]);

  async function markDone(id) {
    try {
      await api.put(`/booking/${id}/status`, { status_booking: "Done" });
      toast.success("Status booking selesai");
      await loadBookings();
    } catch (error) {
      toast.error(error.message || "Gagal mengubah status");
    }
  }

  return (
    <DashboardLayout title="Schedule" subtitle="Lihat antrean dan jadwal pasien berdasarkan tanggal.">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[220px_220px_auto]">
          <input
            type="date"
            value={tanggal}
            onChange={(event) => setTanggal(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Filter className="h-4 w-4" />
            {bookings.length} booking
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : bookings.length ? (
          <div className="grid gap-3">
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-navy">{booking.pasien_nama}</h2>
                    <p className="text-sm text-slate-500">
                      {formatDate(booking.tanggal_kunjungan)} - {formatTime(booking.jam_slot)} - Antrean #
                      {booking.nomor_antrean}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={booking.status_booking} />
                    <button
                      type="button"
                      disabled={booking.status_booking !== "Pending"}
                      onClick={() => markDone(booking.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Jadwal kosong" description="Tidak ada booking sesuai filter." />
        )}
      </div>
    </DashboardLayout>
  );
}
