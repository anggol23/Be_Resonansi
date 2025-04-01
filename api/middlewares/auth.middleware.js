import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandler.js";

// Extract token from headers or cookies
const extractToken = (req) => {
  const tokenFromHeader = req.headers.authorization?.split(" ")[1];
  const tokenFromCookie = req.cookies?.access_token;
  return tokenFromHeader || tokenFromCookie;
};

// Verify token middleware
export const verifyToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    console.warn("⛔ No token found in headers or cookies!");
    return next(errorHandler(401, "Unauthorized! No token provided. Pastikan Anda sudah login."));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("🔴 Token verification failed:", err.message);
      return next(errorHandler(403, "Forbidden! Invalid or expired token."));
    }

    console.log("🔐 Decoded Token:", decoded);
    req.user = decoded;
    next();
  });
};

// Verify admin middleware
export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn("⛔ Unauthorized admin access attempt.");
    return next(errorHandler(403, "Access denied! Admins only."));
  }
  next();
};
