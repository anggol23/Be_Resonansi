import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandler.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.access_token;

  if (!token) {
    console.warn("⛔ No token found!");
    return next(errorHandler(401, "Unauthorized! No token provided."));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("🔴 Token verification failed:", err.message);
      return next(errorHandler(403, "Forbidden! Invalid token."));
    }

    console.log("🔐 Decoded Token:", decoded); 
    req.user = decoded;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn("⛔ Unauthorized admin access attempt.");
    return next(errorHandler(403, "Access denied! Admins only."));
  }
  next();
};
