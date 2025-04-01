import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ✅ Signup - Pendaftaran pengguna baru
export const signup = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Incoming signup request:", { username, email });
  }

  try {
    const assignedRole = role === "admin" ? "admin" : "user"; 

    const newUser = new User({ username, email, password, role: assignedRole });
    await newUser.save();

    const token = generateToken(newUser);

    const { password: pass, ...rest } = newUser._doc;

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ User saved successfully:", newUser);
    }

    res
      .status(201)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .json({
        message: 'Signup successful',
        user: rest,
        access_token: token,
      });
  } catch (error) {
    next(errorHandler(500, "Error signing up"));
  }
};

// ✅ Signin - Login pengguna
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(errorHandler(401, "Invalid credentials"));
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Simpan token di cookies
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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
    next(error);
  }
};

// ✅ Google Login
export const google = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
      user = new User({
        username: req.body.name,
        email: req.body.email,
        googleId: req.body.googleId,
        authProvider: "google",
        profilePicture: req.body.photoUrl,
        role: "user",
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .status(200)
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .json({ user, access_token: token });
  } catch (error) {
    next(errorHandler(500, "Error logging in with Google"));
  }
};

// ✅ Get Current User
export const getMe = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.status(200).json(req.user);
  } catch (error) {
    next(errorHandler(500, "Error fetching user data"));
  }
};
