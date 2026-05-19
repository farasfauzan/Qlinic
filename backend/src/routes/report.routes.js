import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const [[patientRows], [doctorRows], [bookingTodayRows], [activeQueueRows], [statusRows], [topDoctorRows]] =
      await Promise.all([
        pool.query("SELECT COUNT(*) AS total FROM pasien"),
        pool.query("SELECT COUNT(*) AS total FROM dokter"),
        pool.query("SELECT COUNT(*) AS total FROM booking_antrean WHERE tanggal_kunjungan = CURDATE()"),
        pool.query(
          "SELECT COUNT(*) AS total FROM booking_antrean WHERE tanggal_kunjungan = CURDATE() AND status_booking = 'Pending'"
        ),
        pool.query(
          "SELECT status_booking, COUNT(*) AS total FROM booking_antrean GROUP BY status_booking"
        ),
        pool.query(
          `SELECT d.nama AS dokter_nama, d.spesialisasi, COUNT(b.id) AS total_booking
           FROM dokter d
           LEFT JOIN booking_antrean b ON b.id_dokter = d.id
           GROUP BY d.id, d.nama, d.spesialisasi
           ORDER BY total_booking DESC
           LIMIT 5`
        )
      ]);

    res.json({
      success: true,
      data: {
        total_pasien: patientRows[0].total,
        total_dokter: doctorRows[0].total,
        total_booking_hari_ini: bookingTodayRows[0].total,
        antrean_aktif: activeQueueRows[0].total,
        booking_by_status: statusRows,
        top_doctors: topDoctorRows
      }
    });
  })
);

router.get(
  "/bookings",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const [[dailyRows], [statusRows], [topDoctorRows]] = await Promise.all([
      pool.query(
        `SELECT tanggal_kunjungan, COUNT(*) AS total_booking
         FROM booking_antrean
         GROUP BY tanggal_kunjungan
         ORDER BY tanggal_kunjungan DESC
         LIMIT 14`
      ),
      pool.query(
        "SELECT status_booking, COUNT(*) AS total FROM booking_antrean GROUP BY status_booking"
      ),
      pool.query(
        `SELECT d.nama AS dokter_nama, d.spesialisasi, COUNT(b.id) AS total_booking
         FROM dokter d
         LEFT JOIN booking_antrean b ON b.id_dokter = d.id
         GROUP BY d.id, d.nama, d.spesialisasi
         ORDER BY total_booking DESC
         LIMIT 10`
      )
    ]);

    res.json({
      success: true,
      data: {
        total_booking_per_hari: dailyRows,
        booking_by_status: statusRows,
        dokter_terpopuler: topDoctorRows
      }
    });
  })
);

export default router;
