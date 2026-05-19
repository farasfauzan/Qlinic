import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function deleteDoctor(id) {
    if (!window.confirm("Hapus dokter ini?")) return;
    try {
      await api.delete(`/dokter/${id}`);
      toast.success("Dokter berhasil dihapus");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Gagal menghapus dokter");
    }
  }

  return (
    <DashboardLayout title="Manajemen Dokter" subtitle="Tambah, edit, dan hapus data dokter klinik.">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setEditing(emptyDoctor)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-5 w-5" />
          Tambah Dokter
        </button>

        {loading ? (
          <LoadingState />
        ) : doctors.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Nama", "Spesialisasi", "Kontak", "Poliklinik", "Jadwal", "Aksi"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td className="px-4 py-4 font-semibold text-navy">{doctor.nama}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{doctor.spesialisasi}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <p>{doctor.email}</p>
                        <p>{doctor.no_telp}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{doctor.nama_poli || "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{doctor.jadwal_praktik}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing({ ...doctor, password: "" })}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            aria-label="Edit dokter"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDoctor(doctor.id)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                            aria-label="Hapus dokter"
                          >
                            <Trash2 className="h-4 w-4" />
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
          <EmptyState title="Belum ada dokter" description="Tambahkan dokter untuk membuka jadwal booking." />
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
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70 sm:col-span-2"
        >
          <Save className="h-5 w-5" />
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </Modal>
  );
}
