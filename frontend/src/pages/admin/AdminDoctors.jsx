import {
  Heart,
  ListFilter,
  Plus,
  Save,
  Stethoscope,
  User,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";

const emptyDoctor = {
  nama: "",
  spesialisasi: "",
  email: "",
  no_telp: "",
  id_poli: "",
  jadwal_praktik: "",
  password: ""
};
const PAGE_SIZE = 5;

function getInitials(name) {
  if (!name) return "DR";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

function getPoliIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('jantung') || n.includes('kardiologi')) return <Heart className="h-5 w-5" />;
  if (n.includes('anak') || n.includes('pediatri')) return <User className="h-5 w-5" />;
  return <Stethoscope className="h-5 w-5" />;
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterPoli, setFilterPoli] = useState("Semua Poliklinik");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    setLoading(true);
    try {
      const [doctorResponse, poliResponse] = await Promise.all([
        api.get("/dokter"),
        api.get("/poliklinik")
      ]);
      setDoctors(doctorResponse.data);
      setPolyclinics(poliResponse.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/admin/polyclinics')}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Add New Polyclinic
      </button>
      <button
        onClick={() => setEditing(emptyDoctor)}
        className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <UserPlus className="h-4 w-4" />
        Add New Doctor
      </button>
    </div>
  );

  const poliStats = polyclinics.map(poli => {
    const docCount = doctors.filter(d => d.id_poli === poli.id).length;
    // Mock capacity stats based on id
    const capacity = 40 + ((poli.id * 17) % 60); 
    let loadStatus = "Normal";
    let loadColor = "bg-slate-100 text-slate-700";
    if (capacity > 90) {
      loadStatus = "High Load";
      loadColor = "bg-rose-50 text-rose-700";
    } else if (capacity > 75) {
      loadStatus = "Optimal Load";
      loadColor = "bg-emerald-50 text-emerald-700";
    }

    return {
      ...poli,
      docCount,
      capacity,
      loadStatus,
      loadColor
    };
  });

  const filteredDoctors = doctors.filter(doc => {
    // Mock status as "Active" for everyone, except a few to show "On Leave"
    const docStatus = doc.id % 4 === 0 ? "On Leave" : "Active";
    doc._mockStatus = docStatus;

    if (filterStatus !== "Semua" && filterStatus !== docStatus) return false;
    if (filterPoli !== "Semua Poliklinik" && doc.id_poli.toString() !== filterPoli) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPoli]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <DashboardLayout 
      title="Manajemen Dokter & Poliklinik" 
      subtitle="Kelola jadwal, departemen, dan ketersediaan tenaga medis dalam satu dasbor terpadu."
      headerActions={headerActions}
    >
      <div className="space-y-8">
        
        {/* Overview Poliklinik */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Overview Poliklinik</h2>
            <button 
              onClick={() => navigate('/admin/polyclinics')}
              className="text-sm font-semibold text-clinical hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          
          {loading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {poliStats.slice(0, 4).map(poli => (
                <div key={poli.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-clinical">
                      {getPoliIcon(poli.nama_poli)}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${poli.loadColor}`}>
                      {poli.loadStatus}
                    </span>
                  </div>
                  <h3 className="mb-4 font-bold text-navy">{poli.nama_poli}</h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-navy">{String(poli.docCount).padStart(2, '0')}</p>
                      <p className="text-xs font-medium text-slate-500">Dokter Aktif</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy">{poli.capacity}%</p>
                      <p className="text-xs font-medium text-slate-500">Kapasitas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direktori Dokter Table */}
        {!loading && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Filter Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 lg:flex-nowrap">
              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap font-bold text-navy">Direktori Dokter</h3>
                <div className="hidden h-6 w-px bg-slate-200 sm:block"></div>
                <div className="hidden items-center gap-1 sm:flex">
                  {['Semua', 'Aktif', 'On Leave'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilterStatus(tab)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        filterStatus === tab ? 'bg-sky-100 text-clinical' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={filterPoli} 
                  onChange={(e) => setFilterPoli(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-clinical focus:ring-2 focus:ring-sky-100"
                >
                  <option value="Semua Poliklinik">Semua Poliklinik</option>
                  {polyclinics.map(p => <option key={p.id} value={p.id.toString()}>{p.nama_poli}</option>)}
                </select>
                <button className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Filter options">
                  <ListFilter className="h-5 w-5" />
                </button>
              </div>
              
              {/* Mobile tabs */}
              <div className="flex w-full items-center gap-1 overflow-x-auto pb-2 sm:hidden">
                {['Semua', 'Aktif', 'On Leave'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      filterStatus === tab ? 'bg-sky-100 text-clinical' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredDoctors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">Nama Dokter</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">Spesialisasi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">Poliklinik</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDoctors.map(doctor => (
                      <tr key={doctor.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-clinical">
                              {getInitials(doctor.nama)}
                            </div>
                            <div>
                              <p className="font-bold text-navy">{doctor.nama}</p>
                              <p className="text-xs text-slate-500">ID: DOC-{doctor.id.toString().padStart(5, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{doctor.spesialisasi}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-clinical">
                            {doctor.nama_poli || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${doctor._mockStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span className="text-sm font-medium text-slate-700">{doctor._mockStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditing({ ...doctor, password: "" })}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setEditing({ ...doctor, password: "" })}
                              className="whitespace-nowrap rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                            >
                              Manage Schedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <EmptyState title="Tidak ada dokter ditemukan" description="Coba ubah filter pencarian Anda." />
              </div>
            )}
            
            {/* Pagination */}
            {filteredDoctors.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredDoctors.length)} dari {filteredDoctors.length} Dokter
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                        currentPage === page
                          ? "bg-navy text-white"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <DoctorFormModal
          initial={editing}
          polyclinics={polyclinics}
          onClose={() => setEditing(null)}
          onSaved={loadData}
        />
      ) : null}
    </DashboardLayout>
  );
}

function DoctorFormModal({ initial, polyclinics, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial.id);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const payload = { ...form };
    if (!payload.password) delete payload.password;

    try {
      if (isEdit) {
        await api.put(`/dokter/${initial.id}`, payload);
        toast.success("Data dokter diperbarui");
      } else {
        await api.post("/dokter", payload);
        toast.success("Dokter ditambahkan");
      }
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan dokter");
    } finally {
      setLoading(false);
    }
  }

  async function deleteDoctor(id) {
    if (!window.confirm("Hapus dokter ini?")) return;
    try {
      await api.delete(`/dokter/${id}`);
      toast.success("Dokter berhasil dihapus");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menghapus dokter");
    }
  }

  return (
    <Modal title={isEdit ? "Edit Dokter" : "Tambah Dokter"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {[
          ["nama", "Nama Dokter"],
          ["spesialisasi", "Spesialisasi"],
          ["email", "Email"],
          ["no_telp", "No. Telepon"]
        ].map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <input
              value={form[field] || ""}
              onChange={(event) => updateField(field, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              required
            />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Poliklinik</span>
          <select
            value={form.id_poli || ""}
            onChange={(event) => updateField("id_poli", event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            required
          >
            <option value="">Pilih poliklinik</option>
            {polyclinics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama_poli}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password {isEdit ? "Baru" : ""}</span>
          <input
            type="password"
            value={form.password || ""}
            onChange={(event) => updateField("password", event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Default: doctor123"}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Jadwal Praktik</span>
          <input
            value={form.jadwal_praktik || ""}
            onChange={(event) => updateField("jadwal_praktik", event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            placeholder="Senin-Rabu, 08:00-12:00"
            required
          />
        </label>
        
        <div className="mt-2 flex items-center justify-between sm:col-span-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => deleteDoctor(initial.id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-5 py-3 font-semibold text-rose-600 hover:bg-rose-50"
            >
              Hapus Dokter
            </button>
          ) : <div></div>}
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-8 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            <Save className="h-5 w-5" />
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
