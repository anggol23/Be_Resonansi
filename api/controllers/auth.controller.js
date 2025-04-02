import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { setTokenCookie } from '../middlewares/auth.middleware.js';

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✅ Signup - Register a new user
export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return next(errorHandler(400, 'Semua field harus diisi.'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, 'Email sudah digunakan.'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();

    const token = generateToken(savedUser);

    res.status(201).json({
      message: 'Registrasi berhasil.',
      user: { id: savedUser._id, username: savedUser.username, email: savedUser.email },
      access_token: token,
    });
  } catch (error) {
    next(errorHandler(500, 'Terjadi kesalahan saat registrasi.'));
  }
};

// ✅ Signin - Login user
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(errorHandler(400, 'Email dan password harus diisi.'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(errorHandler(404, 'Pengguna tidak ditemukan.'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(errorHandler(401, 'Password salah.'));
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login berhasil.',
      user: { id: user._id, username: user.username, email: user.email },
      access_token: token,
    });
  } catch (error) {
    next(errorHandler(500, 'Terjadi kesalahan saat login.'));
  }
};

// ✅ Google Login
export const google = async (req, res, next) => {
  try {
    const { email, name, googleId, photoUrl } = req.body;
    if (!email || !googleId) {
      return next(errorHandler(400, 'Invalid Google data'));
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: name,
        email,
        googleId,
        authProvider: 'google',
        profilePicture: photoUrl,
        role: 'user',
      });
      await user.save();
    }

    const token = generateToken(user);

    // Set token in cookie
    setTokenCookie(res, token);

    res.status(200).json({ user, access_token: token });
  } catch (error) {
    console.error('Error during Google login:', error);
    next(errorHandler(500, 'Error logging in with Google'));
  }
};

// ✅ Get Current User
export const getMe = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    next(errorHandler(500, 'Error fetching user data'));
  }
};

// ✅ Signout user
export const signout = (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Signout berhasil.' });
};
