import { CalendarX, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime } from "../../utils";

export default function PatientAppointments() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    try {
      const response = await api.get("/pasien/bookings");
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancelBooking(id) {
    try {
      await api.put(`/booking/${id}/cancel`);
      toast.success("Booking berhasil dibatalkan");
      await loadBookings();
    } catch (error) {
      toast.error(error.message || "Gagal membatalkan booking");
    }
  }

  return (
    <DashboardLayout title="Appointments" subtitle="Kelola status booking dan antrean Anda.">
      {loading ? (
        <LoadingState />
      ) : bookings.length ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Dokter", "Tanggal", "Jam", "Antrean", "Status", "Aksi"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-navy">{booking.dokter_nama}</p>
                        <p className="text-sm text-slate-500">{booking.spesialisasi}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatDate(booking.tanggal_kunjungan)}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{formatTime(booking.jam_slot)}</td>
                      <td className="px-4 py-4 font-semibold text-navy">#{booking.nomor_antrean}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status_booking} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking.id)}
                          disabled={booking.status_booking !== "Pending"}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CalendarX className="h-4 w-4" />
                          Batalkan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState title="Belum ada booking" description="Booking baru akan tampil di halaman ini." />
      )}
    </DashboardLayout>
  );
}
