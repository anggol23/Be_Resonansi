import express from 'express';
import {
  publishFile,
  getFiles,
  downloadFile,
  deleteFile,
} from '../controllers/unduhan.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rute untuk mengunggah file (hanya untuk admin)
router.post('/upload', verifyToken, verifyAdmin, publishFile);

// Rute untuk mendapatkan daftar file
router.get('/', getFiles);

// Rute untuk mengunduh file berdasarkan ID
router.get('/download/:id', verifyToken, downloadFile);

// Rute untuk menghapus file berdasarkan ID (hanya untuk admin)
router.delete('/:id', verifyToken, verifyAdmin, deleteFile);

export default router;
