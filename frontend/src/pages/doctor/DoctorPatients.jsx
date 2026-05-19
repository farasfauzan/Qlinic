import { ClipboardPlus, Pill, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime } from "../../utils";

export default function DoctorPatients() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    try {
      const response = await api.get("/dokter/me/bookings");
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <DashboardLayout title="Patients" subtitle="Lihat antrean pasien dan tambahkan rekam medis sederhana.">
      {loading ? (
        <LoadingState />
      ) : bookings.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-navy">{booking.pasien_nama}</h2>
                  <p className="text-sm text-slate-500">NIK {booking.nik}</p>
                </div>
                <StatusBadge status={booking.status_booking} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info label="Tanggal" value={formatDate(booking.tanggal_kunjungan)} />
                <Info label="Jam" value={formatTime(booking.jam_slot)} />
                <Info label="Antrean" value={`#${booking.nomor_antrean}`} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(booking)}
                disabled={booking.status_booking === "Cancelled"}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ClipboardPlus className="h-5 w-5" />
                Tambah Rekam Medis
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Belum ada pasien booking" description="Booking pasien akan tampil di halaman ini." />
      )}

      {selectedBooking ? (
        <MedicalRecordModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSaved={loadBookings}
        />
      ) : null}
    </DashboardLayout>
  );
}

function MedicalRecordModal({ booking, onClose, onSaved }) {
  const [form, setForm] = useState({
    keluhan: "",
    diagnosa: "",
    catatan_dokter: "",
    detail_obat: "",
    dosis: ""
  });
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/rekam-medis", {
        id_booking: booking.id,
        keluhan: form.keluhan,
        diagnosa: form.diagnosa,
        catatan_dokter: form.catatan_dokter,
        resep_obat: form.detail_obat
          ? [{ detail_obat: form.detail_obat, dosis: form.dosis || "-" }]
          : []
      });
      toast.success("Rekam medis berhasil disimpan");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan rekam medis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Rekam Medis ${booking.pasien_nama}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-sky-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-navy">
            {formatDate(booking.tanggal_kunjungan)} - {formatTime(booking.jam_slot)} - Antrean #
            {booking.nomor_antrean}
          </p>
          <p>NIK {booking.nik}</p>
        </div>
        {[
          ["keluhan", "Keluhan Pasien"],
          ["diagnosa", "Diagnosa"],
          ["catatan_dokter", "Catatan Dokter"]
        ].map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <textarea
              value={form[field]}
              onChange={(event) => updateField(field, event.target.value)}
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              required
            />
          </label>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Pill className="h-4 w-4" />
              Detail Obat
            </span>
            <input
              value={form.detail_obat}
              onChange={(event) => updateField("detail_obat", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              placeholder="Contoh: Amoxicillin 500mg"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Dosis</span>
            <input
              value={form.dosis}
              onChange={(event) => updateField("dosis", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              placeholder="Contoh: 3x sehari"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {loading ? "Menyimpan..." : "Simpan Rekam Medis"}
        </button>
      </form>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-navy">{value}</p>
    </div>
  );
}
