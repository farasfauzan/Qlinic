# Qlinic

Qlinic adalah aplikasi web fullstack untuk appointment booking dan antrean digital klinik. Aplikasi ini memiliki 3 role utama: pasien, dokter, dan administrator klinik.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MySQL atau MariaDB
- Auth: JWT + bcrypt
- API: REST API

## Struktur Folder

```text
Qlinic/
  backend/
    database/schema.sql
    database/setup.js
    src/config
    src/middleware
    src/routes
    src/utils
  frontend/
    src/api
    src/components
    src/context
    src/layouts
    src/pages
```

## Setup Lokal

1. Install Node.js 20+ dan MySQL/MariaDB.
2. Buat konfigurasi environment:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Sesuaikan `backend/.env` dengan user dan password database lokal.
4. Install dependency:

```bash
npm install --prefix backend
npm install --prefix frontend
```

5. Buat database, schema, dan seed data:

```bash
npm run db:setup --prefix backend
```

6. Jalankan backend:

```bash
npm run dev --prefix backend
```

7. Jalankan frontend di terminal lain:

```bash
npm run dev --prefix frontend
```

Frontend berjalan di `http://localhost:5173` dan backend di `http://localhost:5000`.

## Akun Seed

- Admin: username `admin`, password `admin123`
- Dokter: email `nadya@qlinic.test`, password `doctor123`
- Pasien: email `ayu@example.com`, password `patient123`

## Database

Schema SQL tersedia di:

```text
backend/database/schema.sql
```

Script setup `backend/database/setup.js` akan:

- Membuat database sesuai `DB_NAME`
- Menjalankan schema
- Menambahkan 1 admin default
- Menambahkan pasien, dokter, poliklinik, booking, rekam medis, dan resep dummy
- Menggunakan bcrypt untuk hash password seed

## Endpoint API Utama

Auth:

- `POST /api/auth/register-pasien`
- `POST /api/auth/login`
- `GET /api/auth/me`

Pasien:

- `GET /api/pasien/me`
- `GET /api/pasien/bookings`
- `GET /api/pasien/medical-records`
- `GET /api/pasien`
- `PUT /api/pasien/:id`
- `DELETE /api/pasien/:id`

Dokter:

- `GET /api/dokter`
- `GET /api/dokter/:id`
- `POST /api/dokter`
- `PUT /api/dokter/:id`
- `DELETE /api/dokter/:id`
- `GET /api/dokter/:id/jadwal`
- `GET /api/dokter/me/bookings`

Poliklinik:

- `GET /api/poliklinik`
- `POST /api/poliklinik`
- `PUT /api/poliklinik/:id`
- `DELETE /api/poliklinik/:id`

Booking:

- `POST /api/booking`
- `GET /api/booking`
- `GET /api/booking/:id`
- `PUT /api/booking/:id/status`
- `PUT /api/booking/:id/cancel`

Rekam Medis:

- `POST /api/rekam-medis`
- `GET /api/rekam-medis`
- `GET /api/rekam-medis/:id`

Report:

- `GET /api/report/summary`
- `GET /api/report/bookings`

## Aturan Bisnis

- Nomor antrean dibuat otomatis berdasarkan jumlah booking dokter pada tanggal yang sama.
- Slot dokter dengan status `Pending` atau `Done` tidak bisa dipakai ulang.
- Pasien hanya bisa membatalkan booking miliknya saat status masih `Pending`.
- Dokter hanya bisa melihat dan menyelesaikan booking miliknya.
- Admin dapat mengelola dokter, pasien, poliklinik, booking, dan report.
- Route backend dilindungi middleware JWT dan role-based access control.
