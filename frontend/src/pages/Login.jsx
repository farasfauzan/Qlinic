import { HeartPulse, LogIn } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const redirectByRole = {
  pasien: "/patient/dashboard",
  dokter: "/doctor/dashboard",
  admin: "/admin/dashboard"
};

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "pasien" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success("Login berhasil");
      navigate(redirectByRole[user.role], { replace: true });
    } catch (error) {
      toast.error(error.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-clinical">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">Qlinic</span>
        </Link>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-sky-200">
            Digital clinic operations
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight">
            Masuk sesuai role dan lanjutkan alur klinik.
          </h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="text-sm font-semibold text-clinical">Login Qlinic</p>
            <h2 className="mt-1 text-3xl font-bold text-navy">Selamat datang</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
              {["pasien", "dokter", "admin"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((value) => ({ ...value, role }))}
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                    form.role === role ? "bg-white text-navy shadow-sm" : "text-slate-500"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {form.role === "admin" ? "Username Admin" : "Email"}
              </span>
              <input
                value={form.email}
                onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
                placeholder={form.role === "admin" ? "admin" : "nama@email.com"}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((value) => ({ ...value, password: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
                placeholder="Masukkan password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn className="h-5 w-5" />
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Belum punya akun pasien?{" "}
            <Link to="/register" className="font-semibold text-clinical">
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
