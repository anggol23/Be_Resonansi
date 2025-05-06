import express from "express";
import {
  publishFile,
  getFiles,
  deleteFile,
  downloadFile,
} from "../controllers/unduhan.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 📂 Public - semua pengguna bisa lihat file yang dipublish
router.get("/published", getFiles);

// 📂 Admin - hanya admin bisa lihat semua file (termasuk unpublished)
router.get("/", verifyToken, verifyAdmin, getFiles);

// 📥 Upload - hanya user login
router.post("/upload", verifyToken, publishFile);

// 🗑️ Delete - hanya admin
router.delete("/:id", verifyToken, verifyAdmin, deleteFile);

// 📥 Download - semua pengguna
router.get("/download/:id", downloadFile);

export default router;
