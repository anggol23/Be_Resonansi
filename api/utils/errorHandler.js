// Fungsi untuk membuat error dengan status dan pesan khusus
export const errorHandler = (statusCode, message, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details; // Tambahkan detail tambahan jika ada
  }
  return error;
};

// Middleware untuk menangani error global
export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Kirimkan respons error
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }), // Sertakan stack trace jika bukan di production
    ...(err.details && { details: err.details }), // Sertakan detail tambahan jika ada
  });
};
