import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import helmet from 'helmet';
import winston from 'winston';
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
const REQUIRED_ENV_VARS = ['MONGO', 'JWT_SECRET', 'PORT'];
REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ ERROR: Variabel ${key} belum dikonfigurasi di .env`);
    process.exit(1);
  }
});

// Konfigurasi
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO;
const CLIENT_URL = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')
  : [
      'https://jurnalresonansi.com',
      'https://api.jurnalresonansi.com',
      'http://localhost:3000',
    ];

// Konfigurasi __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// Middleware utama
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// Konfigurasi CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, 
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  })
);

// Middleware untuk log cookies
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`🔍 Cookies: ${JSON.stringify(req.cookies)}`);
    next();
  });
}

// Fungsi koneksi ke MongoDB dengan validasi
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error}`);
    process.exit(1); // Hentikan server jika tidak bisa connect
  }
};

// Event listener MongoDB
mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB Error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected, mencoba reconnect...');
  connectDB();
});

// Konfigurasi Passport.js
app.use(passport.initialize());

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
  const message = err.message || 'Internal Server Error';

  // Log kesalahan menggunakan Winston
  logger.error(`🔥 Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(isProduction ? {} : { stack: err.stack }), // Berikan stack trace hanya di development
  });
});

// Fallback untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

// Mulai server setelah koneksi MongoDB berhasil
const startServer = async () => {
try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
} catch (error) {
    logger.error(`❌ Gagal memulai server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
