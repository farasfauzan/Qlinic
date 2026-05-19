import { Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadPatients() {
    setLoading(true);
    try {
      const response = await api.get("/pasien");
      setPatients(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function deletePatient(id) {
    if (!window.confirm("Hapus pasien ini?")) return;
    try {
      await api.delete(`/pasien/${id}`);
      toast.success("Pasien berhasil dihapus");
      await loadPatients();
    } catch (error) {
      toast.error(error.message || "Gagal menghapus pasien");
    }
  }

  return (
    <DashboardLayout title="Manajemen Pasien" subtitle="Lihat, edit, dan hapus data pasien.">
      {loading ? (
        <LoadingState />
      ) : patients.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Nama", "NIK", "Email", "No. Telepon", "Aksi"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-4 py-4 font-semibold text-navy">{patient.nama}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{patient.nik}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{patient.email}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{patient.no_telp}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(patient)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                          aria-label="Edit pasien"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePatient(patient.id)}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          aria-label="Hapus pasien"
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
        <EmptyState title="Belum ada pasien" />
      )}

      {editing ? (
        <PatientFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={loadPatients}
        />
      ) : null}
    </DashboardLayout>
  );
}

function PatientFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.put(`/pasien/${initial.id}`, form);
      toast.success("Data pasien diperbarui");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan pasien");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Pasien" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {[
          ["nama", "Nama"],
          ["nik", "NIK"],
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
