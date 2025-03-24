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
const CLIENT_URL = process.env.CLIENT_URL?.split(",") || [
  "https://jurnalresonansi.com",
  "https://api.jurnalresonansi.com",
  "http://localhost:3000",
];

// Konfigurasi __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware utama
app.use(express.json());
app.use(cookieParser());

// Konfigurasi CORS
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
}));

// Fungsi koneksi ke MongoDB dengan retry otomatis
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    setTimeout(connectDB, 5000); // Retry setiap 5 detik
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

// Konfigurasi session dengan MongoStore
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 hari
  }
}));

// Konfigurasi Passport.js
app.use(passport.initialize());
app.use(passport.session());

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
