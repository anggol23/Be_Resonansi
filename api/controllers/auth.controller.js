import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { setTokenCookie } from '../middlewares/auth.middleware.js';

// Helper untuk generate token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ✅ Signup - Pendaftaran pengguna baru
export const signup = async (req, res, next) => {
  const { username, email, password, role, profileImage } = req.body;

  // Validasi input
  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    // Validasi format email menggunakan regex
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return next(errorHandler(400, 'Invalid email format'));
    }

    // Validasi username hanya mengandung huruf kecil dan angka
    if (!/^[a-z0-9]+$/.test(username)) {
      return next(errorHandler(400, 'Username must contain only lowercase letters and numbers'));
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, 'Email already in use'));
    }

    // Tentukan role, hanya admin yang bisa memberi role admin
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Salt round 12 untuk keamanan yang lebih baik
    
    // Simpan data user baru
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: assignedRole,
      profilePicture: profileImage || `https://www.gravatar.com/avatar/${email}?d=identicon`, // Set default profile picture if not provided
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);
    const { password: pass, ...rest } = newUser._doc;

    // Set token di cookie
    setTokenCookie(res, token);
    res.status(201).json({
      message: 'Signup successful',
      user: rest,
      access_token: token,
    });
  } catch (error) {
    console.error('Error during signup:', error);
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

    // Set token di cookie
    setTokenCookie(res, token);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture, // Send profile picture URL
      },
      access_token: token, // Optional: if you want to send token to frontend
    });
  } catch (error) {
    console.error('Error during signin:', error);
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

    // Set token di cookie
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
