import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  FileHeart,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical shadow-lg shadow-sky-950/20">
              <FileHeart className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Qlinic</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-sky-50 md:flex">
            <a href="#fitur" className="hover:text-white">
              Fitur
            </a>
            <a href="#role" className="hover:text-white">
              Role
            </a>
            <a href="#keamanan" className="hover:text-white">
              Keamanan
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-sky-50"
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative flex min-h-[92vh] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(7, 23, 44, 0.96), rgba(11, 31, 58, 0.72), rgba(11, 31, 58, 0.24)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85')"
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-sky-100 ring-1 ring-white/20 backdrop-blur">
              Sistem booking klinik siap operasional
            </p>
            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Qlinic</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-sky-50">
              Sistem klinik modern untuk pasien, dokter, dan administrator agar booking,
              antrean, dan rekam medis berjalan rapi dalam satu alur.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-clinical px-5 py-3 font-semibold text-white shadow-lg shadow-sky-950/25 hover:bg-sky-500"
              >
                Mulai Booking
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-navy shadow-lg shadow-sky-950/10 hover:bg-sky-50"
              >
                Login Akun
                <LogIn className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["3", "Role"],
                ["24/7", "Akses"],
                ["JWT", "Auth"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-sky-100">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="-mt-16 pb-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            {
              icon: CalendarCheck,
              title: "Booking Mudah",
              desc: "Cari dokter, pilih tanggal, pilih slot, lalu nomor antrean dibuat otomatis."
            },
            {
              icon: FileHeart,
              title: "Rekam Medis Digital",
              desc: "Dokter dapat menambahkan keluhan, diagnosa, catatan, dan resep dalam alur yang sama."
            },
            {
              icon: LockKeyhole,
              title: "Keamanan Data",
              desc: "JWT, bcrypt, dan role-based access control menjaga akses pasien, dokter, dan admin."
            }
          ].map((item) => (
            <div key={item.title} className="app-card rounded-2xl p-6 transition">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-clinical ring-1 ring-sky-100">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-navy">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="role" className="bg-cloud py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-clinical">Role workspace</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">Satu aplikasi untuk alur klinik harian</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Pasien",
                desc: "Booking appointment, melihat nomor antrean, dan membaca riwayat rekam medis."
              },
              {
                icon: Stethoscope,
                title: "Dokter",
                desc: "Melihat jadwal pasien, menyelesaikan booking, dan mengisi rekam medis."
              },
              {
                icon: ClipboardCheck,
                title: "Admin Klinik",
                desc: "Mengelola dokter, pasien, poliklinik, antrean, dan report operasional."
              }
            ].map((item) => (
              <article key={item.title} className="app-card rounded-2xl p-6 transition">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="keamanan" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-clinical">Reliable foundation</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">Desain bersih, API jelas, dan akses berbasis role</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["JWT Auth", "Token dipakai untuk melindungi halaman dan endpoint."],
              ["bcrypt", "Password pasien, dokter, dan admin di-hash sebelum disimpan."],
              ["REST API", "Frontend terhubung ke endpoint backend yang konsisten."],
              ["MySQL", "Schema relational dibuat untuk booking, antrean, dan rekam medis."]
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <ShieldCheck className="mb-3 h-5 w-5 text-mint" />
                <h3 className="font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
