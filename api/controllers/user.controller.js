import bcrypt from "bcryptjs";
import { errorHandler } from "../utils/errorHandler.js";
import User from "../models/user.model.js";

export const test = (req, res) => {
  res.json({ message: "API is working!" });
};

// Signup User
export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return next(errorHandler(400, "All fields are required"));
    }

    if (password.length < 6) {
      return next(errorHandler(400, "Password must be at least 6 characters"));
    }

    if (!/^[a-z0-9]+$/.test(username)) {
      return next(errorHandler(400, "Username must contain only lowercase letters and numbers"));
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return next(errorHandler(400, "Username or email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    next(error);
  }
};

// Update User
export const updateUser = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return next(errorHandler(403, "You are not allowed to update this user"));
    }

    const updates = {};
    if (req.body.password && req.body.password.length >= 6) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    if (req.body.username && /^[a-z0-9]+$/.test(req.body.username)) {
      updates.username = req.body.username;
    }
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser && existingUser._id.toString() !== req.params.userId) {
        return next(errorHandler(400, "Email is already in use"));
      }
      updates.email = req.body.email;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.userId, { $set: updates }, { new: true, select: "-password" });
    if (!updatedUser) return next(errorHandler(404, "User not found"));

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Signout User
export const signout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", { httpOnly: true }).status(200).json({ message: "User has been signed out" });
  } catch (error) {
    next(error);
  }
};

// Get Users
export const getUsers = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(errorHandler(403, "You are not allowed to see all users"));
    }
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Get Single User
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return next(errorHandler(404, "User not found"));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User not found"));
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update User Role
export const updateUserRole = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, "Only admins can update user roles"));
    }
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return next(errorHandler(400, "Invalid role"));
    }
    const user = await User.findById(req.params.userId);
    if (!user) return next(errorHandler(404, "User not found"));
    user.role = role;
    await user.save();
    res.status(200).json({ message: "User role updated successfully", user });
  } catch (error) {
    next(error);
  }
};

// Fungsi untuk mendapatkan semua pengguna
export const getAllUsers = async (req, res, next) => {
  try {
    // Pastikan hanya admin yang bisa mengakses daftar semua pengguna
    if (!req.user || req.user.role !== 'admin') {
      return next(errorHandler(403, "You are not authorized to access this resource"));
    }
    
    const users = await User.find().select('-password'); // Ambil semua pengguna, kecuali password
    res.status(200).json(users); // Kirimkan respons dengan daftar pengguna
  } catch (error) {
    next(error); // Proses error jika ada
  }
};