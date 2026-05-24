import { AlertCircle, ClipboardPlus, Clock, FileText, TrendingUp, Users as UsersIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { toInputDate } from "../../utils";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  async function loadBookings() {
    try {
      const response = await api.get(`/dokter/me/bookings?tanggal=${toInputDate()}`);
      setBookings(response.data);
    } catch (err) {
      toast.error("Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const pending = useMemo(() => bookings.filter((b) => b.status_booking === "Pending"), [bookings]);
  const done = useMemo(() => bookings.filter((b) => b.status_booking === "Done"), [bookings]);
  const notificationItems = [
    {
      id: "lab",
      icon: AlertCircle,
      iconClass: "bg-red-50 text-red-500",
      title: "Darurat: Lab Result Ready",
      message: "Hasil lab untuk Pasien #24 (Tn. Ahmad) sudah tersedia untuk ditinjau segera.",
      time: "2 menit yang lalu"
    },
    {
      id: "schedule",
      icon: Clock,
      iconClass: "bg-sky-50 text-sky-500",
      title: "Jadwal Berubah",
      message: "Pasien #22 membatalkan janji temu pukul 14:00. Slot sekarang tersedia.",
      time: "1 jam yang lalu"
    },
    {
      id: "meeting",
      icon: UsersIcon,
      iconClass: "bg-[#0a4778]/10 text-[#0a4778]",
      title: "Rapat Staf",
      message: "Pengingat: Rapat koordinasi mingguan di ruang konferensi A pukul 15:00.",
      time: "3 jam yang lalu"
    },
    {
      id: "record",
      icon: AlertCircle,
      iconClass: "bg-amber-50 text-amber-600",
      title: "Rekam medis perlu dilengkapi",
      message: "Ada pemeriksaan selesai yang belum memiliki catatan dokter lengkap.",
      time: "Kemarin"
    },
    {
      id: "queue",
      icon: UsersIcon,
      iconClass: "bg-emerald-50 text-emerald-600",
      title: "Antrean pagi sudah siap",
      message: "Daftar pasien untuk sesi pagi sudah diperbarui oleh sistem.",
      time: "Kemarin"
    }
  ];

  return (
    <DoctorLayout>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Total Pasien Hari ini</p>
              <h3 className="mt-1 text-3xl font-bold text-[#0a4778]">{bookings.length}</h3>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#0a4778]">
                <TrendingUp className="h-3 w-3" />
                12% lebih banyak dari kemarin
              </p>
            </div>
            
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Pasien Terlayani</p>
              <h3 className="mt-1 text-3xl font-bold text-[#0a4778]">{done.length}</h3>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                  <div 
                    className="h-1.5 rounded-full bg-[#0a4778]" 
                    style={{ width: bookings.length ? `${(done.length / bookings.length) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Sisa Antrean</p>
              <h3 className="mt-1 text-3xl font-bold text-[#0a4778]">
                {pending.length.toString().padStart(2, '0')}
              </h3>
              <p className="mt-2 text-[11px] font-medium text-slate-500">Hingga pukul 17:00 WIB</p>
            </div>
          </div>

          {/* Jadwal Hari Ini Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-navy">Jadwal Hari Ini</h2>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/schedule")}
                  className="text-sm font-semibold text-slate-400 hover:text-navy"
                >
                  Kelola Jadwal
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/doctor/patients")}
                className="rounded-lg bg-[#0a4778] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#073e69]"
              >
                Lihat Semua Pasien
              </button>
            </div>

            {loading ? (
              <LoadingState />
            ) : bookings.length ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 lg:flex-nowrap">
                    <div className="flex flex-1 items-center gap-4">
                      {/* Queue Number Square */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0a4778] text-lg font-bold text-white">
                        {booking.nomor_antrean}
                      </div>
                      <div className="w-32 sm:w-40 shrink-0">
                        <p className="text-xs font-semibold text-slate-500">Nama Pasien</p>
                        <p className="font-bold text-navy truncate">{booking.pasien_nama}</p>
                      </div>
                      <div className="hidden border-l border-slate-200 pl-4 sm:block sm:w-28 shrink-0">
                        <p className="text-xs font-semibold text-slate-500">Waktu</p>
                        <p className="font-bold text-navy">{booking.jam_slot.substring(0, 5)} - {(parseInt(booking.jam_slot.substring(0, 2)) + 1).toString().padStart(2, '0')}:00</p>
                      </div>
                      <div className="hidden border-l border-slate-200 pl-4 md:block md:w-36 shrink-0">
                        <p className="text-xs font-semibold text-slate-500">Tipe Kunjungan</p>
                        <div className={`mt-0.5 inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${booking.status_booking === 'Done' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-[#0a4778]'}`}>
                          {booking.status_booking === "Pending" ? "Baru / Umum" : "Selesai"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/patients?booking=${booking.id}&action=record`)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#0a4778] hover:bg-sky-50"
                      >
                        {booking.status_booking === "Pending" ? (
                          <>
                            <ClipboardPlus className="h-4 w-4" />
                            Isi Rekam Medis
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Rekam Medis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Tidak ada jadwal hari ini" description="Jadwal antrean akan muncul di sini." />
            )}
          </section>
        </div>

        {/* Right Panel: Notifications */}
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-[88px]">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-[15px] font-bold text-navy">Notifikasi & Catatan</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {(showAllNotifications ? notificationItems : notificationItems.slice(0, 3)).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.message}</p>
                    <p className="mt-2 text-[10px] font-medium text-slate-400">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllNotifications((value) => !value)}
              className="w-full rounded-lg border border-[#0a4778]/20 bg-sky-50 py-2.5 text-xs font-bold text-[#0a4778] hover:bg-sky-100 transition"
            >
              {showAllNotifications ? "Tampilkan Lebih Sedikit" : "Lihat Semua Notifikasi"}
            </button>
          </div>
        </aside>
      </div>
    </DoctorLayout>
  );
}
