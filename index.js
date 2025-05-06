import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
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
import MongoDBStore from 'connect-mongodb-session';

dotenv.config();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ ERROR: Variabel MONGO atau JWT_SECRET belum dikonfigurasi di .env");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
}));

// MongoDB Connection
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



// Session and Passport
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'mySessions',
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/unduhan', unduhanRoutes);

// Serve Static Files for Production
// const clientPath = path.join(__dirname, '../client/dist');
// if (fs.existsSync(clientPath)) {
//   app.use(express.static(clientPath));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(clientPath, 'index.html'));
//   });
// } else {
//   console.warn("⚠️ WARNING: Folder 'client/dist' tidak ditemukan. Pastikan frontend sudah di-build.");
// }

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
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

// Start Server setelah koneksi MongoDB berhasil
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
