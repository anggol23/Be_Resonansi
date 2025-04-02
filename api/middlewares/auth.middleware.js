import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandler.js";
import { promisify } from "util";

// ✅ Fungsi untuk mengekstrak token dari header atau cookie
const extractToken = (req) => {
  let token = null;

  // Cek apakah token ada di header Authorization
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Cek apakah token ada di cookie
  else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  return token;
};

// ✅ Middleware untuk memverifikasi token
export const verifyToken = async (req, res, next) => {
  const token = extractToken(req);

  // Jika token tidak ada, kirim error Unauthorized
  if (!token) {
    return next(errorHandler(401, "Unauthorized! No token provided. Pastikan Anda sudah login."));
  }

  try {
    // Gunakan promisify untuk membuat jwt.verify menggunakan async/await
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Simpan data user yang terdecoding dari token ke req.user
    req.user = decoded; 
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(errorHandler(403, "Forbidden! Token has expired. Silakan login kembali."));
    }
    return next(errorHandler(403, "Forbidden! Invalid token."));
  }
};

// ✅ Middleware untuk memverifikasi admin
export const verifyAdmin = (req, res, next) => {
  // Pastikan hanya admin yang bisa mengakses rute ini
  if (!req.user || req.user.role !== "admin") {
    return next(errorHandler(403, "Access denied! Admins only."));
  }
  next();
};
