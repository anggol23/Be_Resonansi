import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✅ Signup - Pendaftaran pengguna baru
export const signup = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, 'Email already in use'));
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ username, email, password: hashedPassword, role: assignedRole });
    await newUser.save();

    const token = generateToken(newUser);
    const { password: pass, ...rest } = newUser._doc;

    res
      .status(201)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .json({
        message: 'Signup successful',
        user: rest,
        access_token: token,
      });
  } catch (error) {
    next(errorHandler(500, 'Error signing up'));
  }
};

// ✅ Signin - Login pengguna
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required'));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(errorHandler(401, 'Invalid credentials'));
    }

    const token = generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      access_token: token, // Opsional, jika ingin mengirim token ke frontend
    });
  } catch (error) {
    next(errorHandler(500, 'Error signing in'));
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

    res
      .status(200)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .json({ user, access_token: token });
  } catch (error) {
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
    next(errorHandler(500, 'Error fetching user data'));
  }
};
