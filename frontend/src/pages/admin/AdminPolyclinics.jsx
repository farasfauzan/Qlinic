import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";

const emptyPolyclinic = {
  nama_poli: "",
  deskripsi: "",
  kapasitas: 20
};

export default function AdminPolyclinics() {
  const [polyclinics, setPolyclinics] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadPolyclinics() {
    setLoading(true);
    try {
      const response = await api.get("/poliklinik");
      setPolyclinics(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolyclinics();
  }, []);

  async function deletePolyclinic(id) {
    if (!window.confirm("Hapus poliklinik ini?")) return;
    try {
      await api.delete(`/poliklinik/${id}`);
      toast.success("Poliklinik berhasil dihapus");
      await loadPolyclinics();
    } catch (error) {
      toast.error(error.message || "Gagal menghapus poliklinik");
    }
  }

  return (
    <DashboardLayout title="Poliklinik" subtitle="Kelola nama poli, deskripsi, dan kapasitas antrean.">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setEditing(emptyPolyclinic)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-5 w-5" />
          Tambah Poliklinik
        </button>

        {loading ? (
          <LoadingState />
        ) : polyclinics.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {polyclinics.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-navy">{item.nama_poli}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.deskripsi}</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-clinical">
                    {item.kapasitas}
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePolyclinic(item.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada poliklinik" description="Tambahkan poli agar dokter bisa dikelompokkan." />
        )}
      </div>

      {editing ? (
        <PolyclinicFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={loadPolyclinics}
        />
      ) : null}
    </DashboardLayout>
  );
}

function PolyclinicFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial.id);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/poliklinik/${initial.id}`, form);
        toast.success("Poliklinik diperbarui");
      } else {
        await api.post("/poliklinik", form);
        toast.success("Poliklinik ditambahkan");
      }
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan poliklinik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? "Edit Poliklinik" : "Tambah Poliklinik"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nama Poli</span>
          <input
            value={form.nama_poli || ""}
            onChange={(event) => updateField("nama_poli", event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Deskripsi</span>
          <textarea
            value={form.deskripsi || ""}
            onChange={(event) => updateField("deskripsi", event.target.value)}
            className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Kapasitas</span>
          <input
            type="number"
            min="1"
            value={form.kapasitas || 1}
            onChange={(event) => updateField("kapasitas", Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </Modal>
  );
}
