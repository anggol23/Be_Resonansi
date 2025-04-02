import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username wajib diisi'],
      unique: true,
      minlength: [3, 'Username minimal 3 karakter'],
      maxlength: [20, 'Username maksimal 20 karakter'],
      match: [/^[a-z0-9]+$/, 'Username hanya boleh berisi huruf kecil dan angka'],
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
    },
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: [6, 'Password minimal 6 karakter'],
      select: false, // Jangan sertakan password dalam query secara default
    },
    profilePicture: {
      type: String,
      default: 'https://www.gravatar.com/avatar/?d=mp',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    googleId: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  { timestamps: true }
);

// Middleware untuk hashing password sebelum menyimpan
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Jika password tidak diubah, lanjutkan
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method untuk membandingkan password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
