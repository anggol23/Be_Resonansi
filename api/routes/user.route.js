import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
} from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rute untuk mendapatkan semua pengguna (hanya untuk admin)
router.get('/getusers', verifyToken, verifyAdmin, getUsers);

// Rute untuk mendapatkan pengguna berdasarkan ID
router.get('/:id', verifyToken, getUserById);

// Rute untuk memperbarui pengguna
router.put('/update/:id', verifyToken, updateUser);

// Rute untuk menghapus pengguna
router.delete('/delete/:id', verifyToken, deleteUser);

// Rute untuk memperbarui role pengguna (hanya untuk admin)
router.put('/update-role/:userId', verifyToken, verifyAdmin, updateUserRole);

export default router;