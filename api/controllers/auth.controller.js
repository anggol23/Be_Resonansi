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
  const { username, email, password, role, profileImage } = req.body;

  // Validation for required fields
  if (!username || !email || !password) {
    return next(errorHandler(400, 'All fields are required'));
  }

  try {
    // Email validation using regex
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return next(errorHandler(400, 'Invalid email format'));
    }

    // Username validation (lowercase letters and numbers)
    if (!/^[a-z0-9]+$/.test(username)) {
      return next(errorHandler(400, 'Username must contain only lowercase letters and numbers'));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, 'Email already in use'));
    }

    // Assign role (only admin can assign 'admin' role)
    const assignedRole = role === 'admin' ? 'admin' : 'user';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: assignedRole,
      profilePicture: profileImage || `https://www.gravatar.com/avatar/${email}?d=identicon`,
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser);
    const { password: pass, ...rest } = newUser._doc;

    // Set token in cookie
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

// ✅ Signin - Login user
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

    // Set token in cookie
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
      access_token: token,
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
