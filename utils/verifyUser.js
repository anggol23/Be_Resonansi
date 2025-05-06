// import jwt from "jsonwebtoken";
// import { errorHandler } from "../utils/errorHandler.js";

// export const verifyToken = (req, res, next) => {
//   const token = req.cookies.access_token;
//   if (!token) {
//     console.log("❌ No Token Found");
//     return next(errorHandler(401, "Unauthorized - No Token"));
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       console.log("❌ Token Invalid:", err.message);
//       return next(errorHandler(401, "Unauthorized - Invalid Token"));
//     }

//     console.log("✅ Decoded Token:", decoded); // Debugging
//     req.user = decoded; 
//     next();
//   });
// };

// export const verifyAdmin = (req, res, next) => {
//   console.log("🛂 Verifying Admin:", req.user); // Debugging

//   if (!req.user || req.user.role !== "admin") {
//     return next(errorHandler(403, "Forbidden - Not Admin"));
//   }

//   next();
// };
