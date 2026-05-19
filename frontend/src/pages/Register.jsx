import { HeartPulse, UserPlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const [form, setForm] = useState({
    nama: "",
    nik: "",
    email: "",
    no_telp: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register-pasien", form);
      toast.success("Registrasi berhasil, silakan login");
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <Link to="/" className="mb-6 inline-flex items-center gap-3 text-navy">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinical text-white">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Qlinic</span>
        </Link>
        <p className="text-sm font-semibold text-clinical">Register Pasien</p>
        <h1 className="mt-1 text-3xl font-bold text-navy">Buat akun pasien</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["nama", "Nama Lengkap", "Nama pasien"],
            ["nik", "NIK", "16 digit NIK"],
            ["email", "Email", "nama@email.com"],
            ["no_telp", "No. Telepon", "08xxxxxxxxxx"]
          ].map(([field, label, placeholder]) => (
            <label key={field} className="block">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input
                value={form[field]}
                onChange={(event) => updateField(field, event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
                placeholder={placeholder}
                required
              />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              placeholder="Minimal 6 karakter"
              minLength={6}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            <UserPlus className="h-5 w-5" />
            {loading ? "Mendaftarkan..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-clinical">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
