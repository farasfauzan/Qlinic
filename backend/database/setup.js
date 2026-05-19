import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "qlinic"
};

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function run() {
  const serverConnection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true
  });

  await serverConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await serverConnection.end();

  const connection = await mysql.createConnection({
    ...config,
    multipleStatements: true
  });

  const schema = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
  await connection.query(schema);

  const adminPassword = await bcrypt.hash("admin123", 10);
  const patientPassword = await bcrypt.hash("patient123", 10);
  const doctorPassword = await bcrypt.hash("doctor123", 10);

  await connection.execute("INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')", [
    "admin",
    adminPassword
  ]);

  await connection.query(
    `INSERT INTO poliklinik (nama_poli, deskripsi, kapasitas) VALUES
     ('Poli Umum', 'Layanan pemeriksaan kesehatan umum dan konsultasi awal.', 30),
     ('Poli Gigi', 'Layanan kesehatan gigi dan mulut.', 18),
     ('Poli Anak', 'Layanan kesehatan anak dan imunisasi.', 24),
     ('Poli Penyakit Dalam', 'Layanan konsultasi penyakit dalam dan kontrol berkala.', 20)`
  );

  await connection.execute(
    `INSERT INTO pasien (nik, nama, email, no_telp, password) VALUES
     (?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?)`,
    [
      "3174010101900001",
      "Ayu Lestari",
      "ayu@example.com",
      "081234567001",
      patientPassword,
      "3174010202900002",
      "Bima Prakoso",
      "bima@example.com",
      "081234567002",
      patientPassword,
      "3174010303900003",
      "Citra Dewi",
      "citra@example.com",
      "081234567003",
      patientPassword
    ]
  );

  await connection.execute(
    `INSERT INTO dokter (id_poli, nama, spesialisasi, email, no_telp, jadwal_praktik, password)
     VALUES
     (?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      "dr. Nadya Putri",
      "Dokter Umum",
      "nadya@qlinic.test",
      "082111110001",
      "Senin-Rabu, 08:00-12:00",
      doctorPassword,
      2,
      "drg. Arman Hakim",
      "Dokter Gigi",
      "arman@qlinic.test",
      "082111110002",
      "Selasa-Kamis, 09:00-14:00",
      doctorPassword,
      3,
      "dr. Raka Mahendra, Sp.A",
      "Spesialis Anak",
      "raka@qlinic.test",
      "082111110003",
      "Senin-Jumat, 10:00-15:00",
      doctorPassword,
      4,
      "dr. Sinta Laras, Sp.PD",
      "Spesialis Penyakit Dalam",
      "sinta@qlinic.test",
      "082111110004",
      "Rabu-Sabtu, 08:00-13:00",
      doctorPassword
    ]
  );

  const today = addDays(0);
  const tomorrow = addDays(1);

  await connection.execute(
    `INSERT INTO booking_antrean
     (id_pasien, id_dokter, tanggal_kunjungan, jam_slot, nomor_antrean, status_booking)
     VALUES
     (?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?),
     (?, ?, ?, ?, ?, ?)`,
    [
      1,
      1,
      today,
      "08:00:00",
      1,
      "Done",
      2,
      1,
      today,
      "09:00:00",
      2,
      "Pending",
      3,
      3,
      tomorrow,
      "10:00:00",
      1,
      "Pending",
      1,
      2,
      tomorrow,
      "11:00:00",
      1,
      "Cancelled"
    ]
  );

  await connection.execute(
    `INSERT INTO rekam_medis
     (id_booking, id_pasien, id_dokter, keluhan, diagnosa, catatan_dokter, tanggal_periksa)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      1,
      1,
      "Demam dan batuk ringan sejak dua hari.",
      "Infeksi saluran napas atas ringan.",
      "Istirahat cukup, minum air hangat, kontrol jika demam lebih dari 3 hari.",
      today
    ]
  );

  await connection.execute(
    "INSERT INTO resep_obat (id_rekam_medis, detail_obat, dosis) VALUES (?, ?, ?)",
    [1, "Paracetamol 500mg", "3x sehari sesudah makan bila demam"]
  );

  await connection.end();

  console.log("Database Qlinic berhasil dibuat dan diisi seed data.");
  console.log("Default admin: username admin, password admin123");
  console.log("Default dokter: email nadya@qlinic.test, password doctor123");
  console.log("Default pasien: email ayu@example.com, password patient123");
}

run().catch((error) => {
  console.error("Gagal setup database:", error.message);
  process.exit(1);
});
