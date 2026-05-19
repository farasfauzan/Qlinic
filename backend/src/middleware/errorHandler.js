export function notFound(req, _res, next) {
  const error = new Error(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || (error.code === "ER_DUP_ENTRY" ? 409 : 500);
  const message =
    error.code === "ER_DUP_ENTRY"
      ? "Data dengan nilai unik tersebut sudah digunakan"
      : error.message || "Terjadi kesalahan server";

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null
  });
}
