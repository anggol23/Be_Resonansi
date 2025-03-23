import bcryptjs from "bcryptjs";
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

    if (typeof password !== "string" || password.trim() === "") {
      return next(errorHandler(400, "Password must be a string and not empty"));
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    next(error);
  }
};

// Update User
export const updateUser = async (req, res, next) => {
  try {
    // Cek apakah user yang sedang login adalah admin atau mencoba mengupdate data mereka sendiri
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return next(errorHandler(403, "You are not allowed to update this user"));
    }

    const updates = {};

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return next(errorHandler(400, "Password must be at least 6 characters"));
      }
      updates.password = bcryptjs.hashSync(req.body.password, 10);
    }

    if (req.body.username) {
      if (req.body.username.length < 7 || req.body.username.length > 20) {
        return next(errorHandler(400, "Username must be between 7 and 20 characters"));
      }
      if (req.body.username.includes(" ")) {
        return next(errorHandler(400, "Username cannot contain spaces"));
      }
      if (req.body.username !== req.body.username.toLowerCase()) {
        return next(errorHandler(400, "Username must be lowercase"));
      }
      if (!/^[a-zA-Z0-9]+$/.test(req.body.username)) {
        return next(errorHandler(400, "Username can only contain letters and numbers"));
      }
      updates.username = req.body.username;
    }

    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser && existingUser._id.toString() !== req.params.userId) {
        return next(errorHandler(400, "Email is already in use"));
      }
      updates.email = req.body.email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true, runValidators: true, select: "-password" }
    );
    console.log('Updated user:', updatedUser);
    if (!updatedUser) {
      return next(errorHandler(404, "User not found"));
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};


// Signout User
export const signout = async (req, res, next) => {
  try {
    res.clearCookie("access_token").status(200).json({ message: "User has been signed out" });
  } catch (error) {
    next(error);
  }
};

// Get Multiple Users
export const getUsers = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return next(errorHandler(403, "You are not allowed to see all users"));
    }

    const startIndex = Number(req.query.startIndex) || 0;
    const limit = Number(req.query.limit) || 9;
    const sortDirection = req.query.sort === "asc" ? 1 : -1;

    if (isNaN(startIndex) || isNaN(limit)) {
      return next(errorHandler(400, "Invalid pagination parameters"));
    }

    const users = await User.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .select("-password");

    const totalUsers = await User.countDocuments();

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      users,
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    next(error);
  }
};

// Get Single User
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Get All Users Without Pagination
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(errorHandler(500, "Error fetching users"));
  }
};

// Delete User
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User not found"));

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(errorHandler(500, "Internal Server Error"));
  }
};

// Update User Role (Promote/Demote)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    // Cek apakah role valid
    if (!role || !["user", "admin"].includes(role)) {
      return next(errorHandler(400, "Role must be 'user' or 'admin'"));
    }

    // Cari user berdasarkan userId
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    console.log(`Updating role for user: ${userId} to ${role}`); // Tambahkan log untuk debug

    // Perbarui role user
    user.role = role;
    await user.save(); // Simpan perubahan
    

    // Kirim response dengan data user terbaru
    res.status(200).json({
      message: "User role updated successfully",
      user: { ...user._doc, role }, // Pastikan role terbaru ada di response
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return next(errorHandler(500, "Error updating user role"));
  }
};
