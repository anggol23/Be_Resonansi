import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ✅ Signup - Pendaftaran pengguna baru
export const signup = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  console.log("🔍 Incoming signup request:", { username, email });

  try {
    const assignedRole = role === "admin" ? "admin" : "user"; // Role harus dikontrol dari backend

    const newUser = new User({ username, email, password, role: assignedRole });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: pass, ...rest } = newUser._doc;

    console.log("✅ User saved successfully:", newUser);

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
    next(error);
  }
};

// ✅ Signin - Login pengguna
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(errorHandler(400, "All fields are required"));
  }

  try {
    const validUser = await User.findOne({ email }).select("+password");
    if (!validUser) {
      return next(errorHandler(404, "User not found"));
    }

    if (!validUser.isActive) {
      return next(errorHandler(403, "Your account has been deactivated"));
    }

    const validPassword = await validUser.comparePassword(password);
    if (!validPassword) {
      return next(errorHandler(400, "Invalid password"));
    }

    const token = jwt.sign(
      { id: validUser._id.toString(), role: validUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: pass, ...rest } = validUser._doc;
    
    console.log("✅ Login successful:", rest); // Debugging

    res
      .status(200)
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
      .json({ user: rest, role: validUser.role, access_token: token });
  } catch (error) {
    console.error("🔥 Error terjadi saat signin:", error);
    next(errorHandler(500, "Error signing in"));
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
        password: await bcrypt.hash("google-auth-user", 10),
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
        sameSite: "none",
      })
      .json({ user, access_token: token });
  } catch (error) {
    next(errorHandler(500, "Error logging in with Google"));
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.status(200).json({ user }); // ✅ Format sesuai ekspektasi frontend
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};



