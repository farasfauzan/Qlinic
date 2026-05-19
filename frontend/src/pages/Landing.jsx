import { ArrowRight, CalendarCheck, FileHeart, LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-navy/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinical">
              <FileHeart className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Qlinic</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-sky-50"
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
            "linear-gradient(90deg, rgba(11, 31, 58, 0.92), rgba(11, 31, 58, 0.56), rgba(11, 31, 58, 0.18)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85')"
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-white">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-sky-100 ring-1 ring-white/20">
              Appointment booking dan antrean digital klinik
            </p>
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl">Qlinic</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-sky-50">
              Sistem klinik modern untuk pasien, dokter, dan administrator agar booking,
              antrean, dan rekam medis berjalan rapi dalam satu alur.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-clinical px-5 py-3 font-semibold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-500"
              >
                Mulai Booking
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-navy hover:bg-sky-50"
              >
                Login Akun
                <LogIn className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-16 pb-16">
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
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-clinical">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-navy">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
