import { CalendarX, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime } from "../../utils";

const statusOptions = ["Pending", "Done", "Cancelled"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ tanggal: "", id_dokter: "", status: "" });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const [bookingResponse, doctorResponse] = await Promise.all([
        api.get(`/booking?${params.toString()}`),
        api.get("/dokter")
      ]);
      setBookings(bookingResponse.data);
      setDoctors(doctorResponse.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filters]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function updateStatus(id, status_booking) {
    try {
      await api.put(`/booking/${id}/status`, { status_booking });
      toast.success("Status booking diperbarui");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Gagal mengubah status");
    }
  }

  async function cancelBooking(id) {
    try {
      await api.put(`/booking/${id}/cancel`);
      toast.success("Booking dibatalkan");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Gagal membatalkan booking");
    }
  }

  return (
    <DashboardLayout title="Booking/Antrean" subtitle="Monitor semua booking dan nomor antrean klinik.">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="date"
            value={filters.tanggal}
            onChange={(event) => updateFilter("tanggal", event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
          />
          <select
            value={filters.id_dokter}
            onChange={(event) => updateFilter("id_dokter", event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Dokter</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.nama}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingState />
        ) : bookings.length ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Pasien", "Dokter", "Tanggal", "Antrean", "Status", "Aksi"].map((head) => (
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
                        <p className="font-semibold text-navy">{booking.pasien_nama}</p>
                        <p className="text-sm text-slate-500">{booking.nik}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-navy">{booking.dokter_nama}</p>
                        <p className="text-sm text-slate-500">{booking.spesialisasi}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDate(booking.tanggal_kunjungan)} - {formatTime(booking.jam_slot)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-navy">#{booking.nomor_antrean}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status_booking} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={booking.status_booking}
                            onChange={(event) => updateStatus(booking.id, event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => updateStatus(booking.id, booking.status_booking)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            aria-label="Simpan status"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelBooking(booking.id)}
                            disabled={booking.status_booking !== "Pending"}
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Batalkan booking"
                          >
                            <CalendarX className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="Booking tidak ditemukan" description="Ubah filter untuk melihat data lain." />
        )}
      </div>
    </DashboardLayout>
  );
}
