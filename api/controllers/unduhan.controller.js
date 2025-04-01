import fs from "fs";
import path from "path";
import multer from "multer";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// 📂 Folder Penyimpanan
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const IMAGE_DIR = path.join(UPLOADS_DIR, "images");

// 🔹 Pastikan folder sudah ada
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

// 🔹 Konfigurasi penyimpanan file & gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") {
      cb(null, UPLOADS_DIR);
    } else if (file.fieldname === "image") {
      cb(null, IMAGE_DIR);
    } else {
      cb(new Error("Unexpected field"), false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// 🔹 Filter jenis file yang diizinkan
const fileFilter = (req, file, cb) => {
  console.log("📂 Upload:", file.originalname, "📝 MIME:", file.mimetype);

  const fileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ];
  const imageTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (file.fieldname === "file" && fileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === "image" && imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error("⛔ Format tidak diizinkan:", file.mimetype);
    cb(new Error(`Format tidak diizinkan: ${file.mimetype}`), false);
  }
};

// 🔹 Middleware untuk multiple file upload
const upload = multer({ storage, fileFilter }).fields([
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// 🔹 Controller untuk mengunggah file & gambar
export const publishFile = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("⛔ Multer error:", err);
      return next(errorHandler(400, err.message || "Gagal mengunggah file"));
    }

    console.log("📂 Files:", JSON.stringify(req.files, null, 2));
    console.log("📝 Body:", req.body);

    try {
      const uploadedFile = req.files?.file ? req.files.file[0] : null;
      const uploadedImage = req.files?.image ? req.files.image[0] : null;

      if (!uploadedFile) {
        return next(errorHandler(400, "File harus diunggah"));
      }
      if (!req.body.filename) {
        return next(errorHandler(400, "Nama file harus diisi"));
      }

      const newFile = new Unduhan({
        title: req.body.filename,
        filename: uploadedFile.filename,
        originalname: uploadedFile.originalname,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
        path: uploadedFile.path,
        imagePath: req.body.imagePath || (uploadedImage ? uploadedImage.path : null),
        uploadedBy: req.user ? req.user.id : null,
      });

      const savedFile = await newFile.save();
      res.status(201).json(savedFile);
    } catch (error) {
      next(error);
    }
  });
};

// 🔹 Controller untuk mendapatkan daftar file (tanpa token)
export const getFiles = async (req, res) => {
  try {
    const files = await Unduhan.find(); // Pastikan model `Unduhan` digunakan
    res.status(200).json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data file" });
  }
};

// 🔹 Controller untuk mengunduh file berdasarkan ID (tanpa token)
export const downloadFile = async (req, res) => {
  try {
    const file = await Unduhan.findById(req.params.id); // Pastikan model `Unduhan` digunakan
    if (!file) {
      return res.status(404).json({ success: false, message: "File tidak ditemukan" });
    }
    res.download(file.path, file.filename);
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengunduh file" });
  }
};

// 🔹 Controller untuk menghapus file
export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await Unduhan.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File tidak ditemukan" });
    }

    // Hapus file dari sistem
    const fs = await import("fs/promises");
    await fs.unlink(file.path).catch(() => null);
    if (file.imagePath) await fs.unlink(file.imagePath).catch(() => null);

    // Hapus dari database
    await Unduhan.findByIdAndDelete(fileId);

    res.json({ message: "File berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};

const handleDownload = async (fileId, filename) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Anda harus login terlebih dahulu!");
      return;
    }

    const response = await fetch(`${API_URL}/api/unduhan/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⛔ Error Response:", errorText);
      throw new Error("Gagal mengunduh file");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("⛔ Download Error:", error);
    alert("Terjadi kesalahan saat mengunduh file.");
  }
};

