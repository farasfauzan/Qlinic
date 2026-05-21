import {
  ArrowRight,
  CalendarCheck,
  Eye,
  EyeOff,
  FileHeart,
  HeartPulse,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!agreed) {
      toast.error("Anda harus menyetujui Syarat & Ketentuan");
      return;
    }
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
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left Panel */}
      <section className="hidden bg-[#0a4778] p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0a4778] shadow-lg">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">Qlinic</span>
          </Link>

          <h1 className="text-4xl font-bold leading-tight">
            Mulai Perjalanan Sehat Anda Hari Ini.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-sky-100/90">
            Gabung bersama ribuan pasien yang telah mempercayakan manajemen kesehatan digital mereka kepada Qlinic.
          </p>

          <div className="mt-12 space-y-8">
            <div className="flex items-start gap-4">
              <CalendarCheck className="mt-1 h-6 w-6 shrink-0 text-sky-300" />
              <div>
                <h3 className="font-bold text-white">Booking Mudah</h3>
                <p className="mt-1 text-sm leading-relaxed text-sky-100/80">
                  Jadwalkan konsultasi dengan dokter spesialis hanya dalam beberapa klik.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FileHeart className="mt-1 h-6 w-6 shrink-0 text-sky-300" />
              <div>
                <h3 className="font-bold text-white">Rekam Medis Digital</h3>
                <p className="mt-1 text-sm leading-relaxed text-sky-100/80">
                  Akses riwayat medis, resep, dan hasil lab Anda kapan saja, di mana saja.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-sky-300" />
              <div>
                <h3 className="font-bold text-white">Keamanan Terjamin</h3>
                <p className="mt-1 text-sm leading-relaxed text-sky-100/80">
                  Data kesehatan Anda dilindungi dengan enkripsi tingkat medis tercanggih.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[480px]">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-navy">Pendaftaran Pasien</h2>
            <p className="mt-2 text-[15px] text-slate-500">
              Lengkapi data di bawah ini untuk membuat akun baru.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Nama Lengkap (Sesuai KTP)</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  value={form.nama}
                  onChange={(e) => updateField("nama", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder="John Doe"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">NIK (Nomor Induk Kependudukan)</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <IdCard className="h-5 w-5" />
                </div>
                <input
                  value={form.nik}
                  onChange={(e) => updateField("nik", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder="16 digit nomor identitas"
                  required
                />
              </div>
            </label>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Alamat Email</span>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                    placeholder="contoh@gmail.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nomor Telepon</span>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    value={form.no_telp}
                    onChange={(e) => updateField("no_telp", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                    placeholder="0812xxxxxxx"
                    required
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Kata Sandi</span>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                  placeholder="Min. 6 karakter"
                  minLength={6}
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
            </label>

            <div className="mt-2 flex items-start gap-3">
              <div className="flex h-5 items-center">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0a4778] focus:ring-[#0a4778]"
                />
              </div>
              <label className="text-sm text-slate-600">
                Saya menyetujui <span className="font-bold text-[#0a4778]">Syarat & Ketentuan</span> serta <span className="font-bold text-[#0a4778]">Kebijakan Privasi</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a4778] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#073e69] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          
          <p className="mt-8 text-center text-[13px] font-medium text-slate-500">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-bold text-[#0a4778] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
