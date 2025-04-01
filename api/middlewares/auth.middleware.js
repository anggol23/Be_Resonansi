import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandler.js";

// ✅ Fungsi untuk mengekstrak token dari header atau cookie
const extractToken = (req) => {
  let token = null;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  return token;
};

// ✅ Middleware untuk memverifikasi token
export const verifyToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(errorHandler(401, "Unauthorized! No token provided. Pastikan Anda sudah login."));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(errorHandler(403, "Forbidden! Token has expired. Silakan login kembali."));
      }
      return next(errorHandler(403, "Forbidden! Invalid token."));
    }

    req.user = decoded; // Simpan data user dari token
    next();
  });
};

// ✅ Middleware untuk memverifikasi admin
export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(errorHandler(403, "Access denied! Admins only."));
  }
  next();
};
