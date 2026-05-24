import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();
let resetTableReady = false;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

async function getUserByRole(role, identifier) {
  if (role === "pasien") {
    const [rows] = await pool.query(
      "SELECT id, nama, email, password, 'pasien' AS role FROM pasien WHERE email = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  if (role === "dokter") {
    const [rows] = await pool.query(
      "SELECT id, nama, email, password, 'dokter' AS role FROM dokter WHERE email = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  if (role === "admin") {
    const [rows] = await pool.query(
      "SELECT id, username AS nama, username AS email, password, role FROM admin WHERE username = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  throw new HttpError(400, "Role login tidak dikenali");
}

function normalizeResetRole(role) {
  const normalizedRole = String(role).toLowerCase();
  if (!["pasien", "dokter"].includes(normalizedRole)) {
    throw new HttpError(400, "Fitur lupa kata sandi hanya tersedia untuk pasien dan dokter");
  }

  return normalizedRole;
}

async function ensurePasswordResetTable() {
  if (resetTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_role ENUM('pasien', 'dokter') NOT NULL,
      requester_id INT NOT NULL,
      code VARCHAR(7) NOT NULL UNIQUE,
      status ENUM('PENDING', 'APPROVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
      approved_by INT NULL,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reset_status (status, created_at),
      INDEX idx_reset_requester (requester_role, requester_id),
      CONSTRAINT fk_reset_approved_by
        FOREIGN KEY (approved_by) REFERENCES admin(id)
        ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  resetTableReady = true;
}

function generateResetCode() {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + crypto.randomInt(0, 26))
  ).join("");
  const numbers = String(crypto.randomInt(0, 1000)).padStart(3, "0");

  return `${letters}-${numbers}`;
}

async function generateUniqueResetCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateResetCode();
    const [rows] = await pool.query(
      "SELECT id FROM password_reset_requests WHERE code = ? LIMIT 1",
      [code]
    );

    if (!rows.length) return code;
  }

  throw new HttpError(500, "Gagal membuat kode reset unik");
}

function generateTemporaryPassword() {
  const token = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `Qlinic-${token}`;
}

async function getResetRequests(status = "PENDING") {
  const normalizedStatus = String(status).toUpperCase();
  const allowedStatuses = ["PENDING", "APPROVED", "CANCELLED", "ALL"];
  if (!allowedStatuses.includes(normalizedStatus)) {
    throw new HttpError(400, "Status permintaan reset tidak valid");
  }

  const params = [];
  const statusWhere = normalizedStatus === "ALL" ? "" : "WHERE r.status = ?";
  if (normalizedStatus !== "ALL") params.push(normalizedStatus);

  const [rows] = await pool.query(
    `SELECT r.*, requester.nama, requester.email, a.username AS approved_by_username
     FROM password_reset_requests r
     JOIN (
       SELECT id, nama, email, 'pasien' AS requester_role FROM pasien
       UNION ALL
       SELECT id, nama, email, 'dokter' AS requester_role FROM dokter
     ) requester
       ON requester.id = r.requester_id
      AND requester.requester_role = r.requester_role
     LEFT JOIN admin a ON a.id = r.approved_by
     ${statusWhere}
     ORDER BY r.created_at DESC`,
    params
  );

  return rows;
}

router.post(
  "/register-pasien",
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama", "nik", "email", "no_telp", "password"]);

    const { nama, nik, email, no_telp, password } = req.body;
    const [existing] = await pool.query(
      "SELECT id FROM pasien WHERE nik = ? OR email = ? LIMIT 1",
      [nik, email]
    );

    if (existing.length) {
      throw new HttpError(409, "NIK atau email sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO pasien (nik, nama, email, no_telp, password)
       VALUES (?, ?, ?, ?, ?)`,
      [nik, nama, email, no_telp, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Registrasi pasien berhasil",
      data: { id: result.insertId, nama, nik, email, no_telp }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["email", "password", "role"]);

    const { email, password, role } = req.body;
    const normalizedRole = String(role).toLowerCase();
    const user = await getUserByRole(normalizedRole, email);

    if (!user) {
      throw new HttpError(401, "Email/username atau password salah");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpError(401, "Email/username atau password salah");
    }

    const token = signToken({ id: user.id, role: normalizedRole });
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: normalizedRole
        }
      }
    });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["email", "role"]);

    const { email, role } = req.body;
    const normalizedRole = normalizeResetRole(role);
    const identifier = String(email).trim();
    const user = await getUserByRole(normalizedRole, identifier);

    if (!user) {
      throw new HttpError(404, "Akun tidak ditemukan. Periksa kembali email/username dan role.");
    }

    await ensurePasswordResetTable();
    const code = await generateUniqueResetCode();

    await pool.query(
      `UPDATE password_reset_requests
       SET status = 'CANCELLED'
       WHERE requester_role = ? AND requester_id = ? AND status = 'PENDING'`,
      [normalizedRole, user.id]
    );

    await pool.query(
      `INSERT INTO password_reset_requests (requester_role, requester_id, code)
       VALUES (?, ?, ?)`,
      [normalizedRole, user.id, code]
    );

    res.json({
      success: true,
      message: "Instruksi pemulihan kata sandi berhasil dibuat",
      data: {
        code,
        adminContact: env.adminContact,
        instruction: `Beri tahu admin kode ini: '${code}' untuk mereset password Anda. WhatsApp: ${env.adminContact}.`
      }
    });
  })
);

router.get(
  "/password-reset-requests",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(403, "Hanya admin yang dapat melihat permintaan reset password");
    }

    await ensurePasswordResetTable();
    const data = await getResetRequests(req.query.status || "PENDING");
    res.json({ success: true, data });
  })
);

router.patch(
  "/password-reset-requests/:id/approve",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(403, "Hanya admin yang dapat menyetujui reset password");
    }

    await ensurePasswordResetTable();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [requests] = await connection.query(
        "SELECT * FROM password_reset_requests WHERE id = ? FOR UPDATE",
        [req.params.id]
      );
      const request = requests[0];

      if (!request) {
        throw new HttpError(404, "Permintaan reset tidak ditemukan");
      }

      if (request.status !== "PENDING") {
        throw new HttpError(400, "Kode reset sudah tidak aktif");
      }

      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      const targetTable = request.requester_role === "pasien" ? "pasien" : "dokter";

      const [updateUser] = await connection.query(
        `UPDATE ${targetTable} SET password = ? WHERE id = ?`,
        [hashedPassword, request.requester_id]
      );

      if (!updateUser.affectedRows) {
        throw new HttpError(404, "Akun pemohon reset tidak ditemukan");
      }

      await connection.query(
        `UPDATE password_reset_requests
         SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [req.user.id, request.id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: "Permintaan reset disetujui dan password sementara sudah dibuat",
        data: {
          code: request.code,
          temporaryPassword
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, role } = req.user;
    let rows;

    if (role === "pasien") {
      [rows] = await pool.query(
        "SELECT id, nik, nama, email, no_telp, 'pasien' AS role FROM pasien WHERE id = ?",
        [id]
      );
    } else if (role === "dokter") {
      [rows] = await pool.query(
        `SELECT d.id, d.id_poli, p.nama_poli, d.nama, d.spesialisasi, d.email,
                d.no_telp, d.jadwal_praktik, 'dokter' AS role
         FROM dokter d
         LEFT JOIN poliklinik p ON p.id = d.id_poli
         WHERE d.id = ?`,
        [id]
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, username AS nama, username AS email, role FROM admin WHERE id = ?",
        [id]
      );
    }

    if (!rows[0]) {
      throw new HttpError(404, "User tidak ditemukan");
    }

    res.json({ success: true, data: rows[0] });
  })
);

export default router;
