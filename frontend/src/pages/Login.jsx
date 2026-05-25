import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  KeyRound,
  Lock,
  Mail,
  Settings,
  Stethoscope,
  User
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const redirectByRole = {
  pasien: "/patient/dashboard",
  dokter: "/doctor/dashboard",
  admin: "/admin/dashboard"
};

const defaultAdminContact = "0812-3456-7000";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", role: "pasien" });
  const [forgotForm, setForgotForm] = useState({ email: "", role: "pasien" });
  const [forgotInstruction, setForgotInstruction] = useState("");
  const [forgotContact, setForgotContact] = useState(defaultAdminContact);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  function openForgotPassword() {
    const resetRole = form.role === "dokter" ? "dokter" : "pasien";
    setForgotForm({ email: form.role === "admin" ? "" : form.email, role: resetRole });
    setForgotInstruction("");
    setForgotContact(defaultAdminContact);
    setForgotOpen(true);
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setForgotLoading(true);
    setForgotInstruction("");

    try {
      const response = await api.post("/auth/forgot-password", forgotForm);
      setForgotInstruction(response.data.instruction);
      setForgotContact(response.data.adminContact || defaultAdminContact);
      toast.success(response.message || "Instruksi pemulihan berhasil dibuat");
    } catch (error) {
      toast.error(error.message || "Gagal memproses lupa kata sandi");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left Panel */}
      <section className="hidden bg-[#0a4778] p-12 text-white lg:flex lg:flex-col lg:justify-center relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=85')"
          }}
        />
        <div className="relative z-10 mx-auto max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0a4778] shadow-lg">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">Qlinic</span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight">
            Solusi Manajemen Klinis Terpercaya
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sky-100/90">
            Akses rekam medis, kelola jadwal, dan konsultasi tim medis dalam satu platform yang aman dan efisien. Dirancang untuk kelancaran klinik dan kemudahan akses.
          </p>

          <div className="mt-10 flex items-center gap-6">
            <div>
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className="text-sm font-medium text-sky-200">Pasien</p>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm font-medium text-sky-200">Dokter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-navy">Selamat Datang Kembali</h2>
            <p className="mt-2 text-[15px] text-slate-500">
              Silakan masuk untuk melanjutkan akses ke platform Qlinic.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1.5">
              {[
                { id: "pasien", label: "Pasien", icon: User },
                { id: "dokter", label: "Dokter", icon: Stethoscope },
                { id: "admin", label: "Admin", icon: Settings }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm((value) => ({ ...value, role: r.id }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition ${
                    form.role === r.id
                      ? "bg-white text-navy shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <r.icon className="h-4 w-4" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                {form.role === "admin" ? "Username Admin" : "Alamat Email"}
              </span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  {form.role === "admin" ? <User className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <input
                  value={form.email}
                  onChange={(e) => setForm((value) => ({ ...value, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder={form.role === "admin" ? "admin" : "nama@email.com"}
                  required
                />
              </div>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Kata Sandi</span>
                {form.role !== "admin" ? (
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs font-bold text-[#0a4778] hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                ) : null}
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((value) => ({ ...value, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-navy"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0a4778] focus:ring-[#0a4778]"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600">
                Ingat saya di perangkat ini
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a4778] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#073e69] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Masuk"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] font-medium text-slate-500">
            Belum punya akun pasien?{" "}
            <Link to="/register" className="font-bold text-[#0a4778] hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </section>

      {forgotOpen ? (
        <Modal title="Lupa Kata Sandi" onClose={() => setForgotOpen(false)}>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-[#0a4778]">
              Masukkan email sesuai role akun. Sistem akan membuat kode unik yang perlu
              diberikan ke admin klinik untuk reset password.
              <span className="mt-2 block font-semibold">WhatsApp admin: {forgotContact}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
              {[
                { id: "pasien", label: "Pasien", icon: User },
                { id: "dokter", label: "Dokter", icon: Stethoscope }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForgotForm((value) => ({ ...value, role: r.id }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition ${
                    forgotForm.role === r.id
                      ? "bg-white text-navy shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <r.icon className="h-4 w-4" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Alamat Email
              </span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm((value) => ({ ...value, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </label>

            {forgotInstruction ? (
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{forgotInstruction}</p>
              </div>
            ) : null}

            <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                disabled={forgotLoading}
                className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0a4778] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#073e69] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {forgotLoading ? "Memproses..." : "Cek Akun"}
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
