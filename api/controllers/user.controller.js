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
    const { username, email, profilePicture, password } = req.body;

    const updatedData = { username, email, profilePicture };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return next(errorHandler(404, 'Pengguna tidak ditemukan.'));
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    next(errorHandler(500, 'Gagal memperbarui data pengguna.'));
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
    const users = await User.find().select('-password'); // Exclude password
    res.status(200).json({ users });
  } catch (error) {
    next(errorHandler(500, 'Gagal mengambil data pengguna.'));
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

// Get a single user by ID
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(errorHandler(404, 'Pengguna tidak ditemukan.'));
    }
    res.status(200).json(user);
  } catch (error) {
    next(errorHandler(500, 'Gagal mengambil data pengguna.'));
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return next(errorHandler(404, 'Pengguna tidak ditemukan.'));
    }
    res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    next(errorHandler(500, 'Gagal menghapus pengguna.'));
  }
};

// Update User Role
export const updateUserRole = async (req, res, next) => {
  try {
    // Pastikan hanya admin yang dapat mengubah role pengguna
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, "Hanya admin yang dapat mengubah role pengguna."));
    }

    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return next(errorHandler(400, "Role tidak valid. Role harus 'user' atau 'admin'."));
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(errorHandler(404, "Pengguna tidak ditemukan."));
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role pengguna berhasil diperbarui.", user });
  } catch (error) {
    next(errorHandler(500, "Gagal memperbarui role pengguna."));
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