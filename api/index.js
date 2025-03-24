import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables lebih awal
dotenv.config();

// Import routes & middleware setelah dotenv
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import unduhanRoutes from './routes/unduhan.route.js';
import './middlewares/passport.js';

// Validasi variabel environment yang wajib
const REQUIRED_ENV_VARS = ['MONGO', 'JWT_SECRET', 'SESSION_SECRET'];
REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ ERROR: Variabel ${key} belum dikonfigurasi di .env`);
    process.exit(1);
  }
});

// Konfigurasi
const PORT = process.env.PORT || 5000; // Railway akan menetapkan port otomatis
const MONGO_URI = process.env.MONGO;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CLIENT_URL = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : [
      "https://jurnalresonansi.com",
      "https://api.jurnalresonansi.com",
      "http://localhost:5173"
    ];

// Konfigurasi __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware utama
app.use(express.json());
app.use(cookieParser());

// 🔥 Perbaikan CORS dengan logging error
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || CLIENT_URL.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS Blocked: ${origin}`);
      callback(new Error("CORS Not Allowed"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
}));

// Tangani preflight request (OPTIONS)
app.options('*', cors());

// Fungsi koneksi ke MongoDB dengan retry maksimal 5 kali
const MAX_RETRIES = 5;
let retryCount = 0;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
    retryCount = 0; // Reset jika berhasil
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log("🔄 Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
    } else {
      console.error("❌ Maximum retry attempts reached. Exiting...");
      process.exit(1);
    }
  }
};

// Event listener MongoDB
mongoose.connection.on("connected", () => console.log("✅ MongoDB is connected"));
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err);
  fs.appendFileSync("error.log", `[${new Date().toISOString()}] MongoDB Error: ${err}\n`);
});
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected, mencoba reconnect...");
  connectDB();
});

// Konfigurasi session dengan MongoStore (cookie lebih aman)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 14 * 24 * 60 * 60, // 14 hari
    autoRemove: 'interval',
    autoRemoveInterval: 10,
  }),
  cookie: {
    secure: process.env.USE_SECURE_COOKIES === 'true', // Bisa diatur di .env
    httpOnly: true,
    sameSite: "none", // Untuk frontend di domain berbeda
    maxAge: 1000 * 60 * 60 * 24, // 1 hari
  }
}));

// Konfigurasi Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Logging waktu respons setiap request
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`📡 [${req.method}] ${req.originalUrl} - ${Date.now() - start}ms`);
  });
  next();
});

// Register API routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/unduhan', unduhanRoutes);

// Global Error Handler
const isProduction = process.env.NODE_ENV === 'production';

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`🔥 Error: ${message}`);

  // Simpan error ke log file
  fs.appendFileSync("error.log", `[${new Date().toISOString()}] ${message}\n`);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// Mulai server setelah koneksi MongoDB berhasil
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
