import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
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
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ ERROR: Variabel MONGO atau JWT_SECRET belum dikonfigurasi di .env");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet()); // Menambah keamanan header HTTP
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
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => console.log("✅ MongoDB is connected"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Error:", err));
mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/unduhan', unduhanRoutes);

// Session and Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // Set true jika production
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Global Error Handler
app.use(errorHandler);

// Start Server setelah koneksi MongoDB berhasil
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});
