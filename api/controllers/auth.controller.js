import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';

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

    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Login successful:", rest);
    }

    res
      .status(200)
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .json({ user: rest, role: validUser.role, access_token: token });
  } catch (error) {
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
