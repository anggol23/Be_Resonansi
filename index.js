import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo'; // ✅ Import yang benar
import passport from 'passport';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import unduhanRoutes from './routes/unduhan.route.js';
import { errorHandler } from './utils/errorHandler.js';
import './middlewares/passport.js';

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!MONGO_URI || !JWT_SECRET || !SESSION_SECRET) {
  console.error("❌ ERROR: Variabel .env belum lengkap. Perlu MONGO, JWT_SECRET, SESSION_SECRET");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware umum
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'https://jurnalresonansi.com',  
    'https://api.jurnalresonansi.com',  
    'http://localhost:5173'  
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
}));

// Koneksi MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};

mongoose.connection.on("connected", () => console.log("✅ MongoDB is connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Error:", err));
mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));

// Session dan Passport
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes API
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/unduhan', unduhanRoutes);

// Serve static (jika frontend sudah dibuild)
// const clientPath = path.join(__dirname, '../client/dist');
// if (fs.existsSync(clientPath)) {
//   app.use(express.static(clientPath));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(clientPath, 'index.html'));
//   });
// }

// Handler Error Global
app.use((err, req, res, next) => {
  const statusCode = err.statusCode;
  const message = err.message || "Internal Server Error";
  const stackTrace = process.env.NODE_ENV === 'development' ? err.stack : null;

  console.error(`🔥 Error: ${message}`);
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stackTrace,
  });
});

// Jalankan server setelah MongoDB siap
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
