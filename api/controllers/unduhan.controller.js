import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// 📂 Folder Penyimpanan
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const IMAGE_DIR = path.join(UPLOADS_DIR, "images");

// 🔹 Pastikan folder sudah ada
const ensureDirExists = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error(`⛔ Error creating directory ${dir}:`, error);
  }
};

ensureDirExists(UPLOADS_DIR);
ensureDirExists(IMAGE_DIR);

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
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${uniqueSuffix}-${path.basename(file.originalname)}`);
  },
});

// 🔹 Filter jenis file yang diizinkan & batasi ukuran
const fileFilter = (req, file, cb) => {
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batasi ukuran file maksimal 5MB
}).fields([
  { name: "file", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// 🔹 Controller untuk mengunggah file
export const publishFile = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(errorHandler(400, err.message || "Gagal mengunggah file"));
    }

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
        path: path.relative(process.cwd(), uploadedFile.path),
        imagePath: uploadedImage ? path.relative(process.cwd(), uploadedImage.path) : null,
        uploadedBy: req.user ? req.user.id : null,
      });

      const savedFile = await newFile.save();
      res.status(201).json(savedFile);
    } catch (error) {
      next(error);
    }
  });
};

// 🔹 Controller untuk mendapatkan daftar file
export const getFiles = async (req, res, next) => {
  try {
    const files = await Unduhan.find();
    res.status(200).json({ success: true, files });
  } catch (error) {
    next(errorHandler(500, "Gagal mengambil data file"));
  }
};

// 🔹 Controller untuk mengunduh file
export const downloadFile = async (req, res, next) => {
  try {
    const file = await Unduhan.findById(req.params.id);
    if (!file) {
      return next(errorHandler(404, "File tidak ditemukan"));
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(file.path));
    if (!fs.existsSync(filePath)) {
      return next(errorHandler(404, "File tidak ditemukan di server"));
    }

    res.setHeader("Content-Disposition", `attachment; filename="${file.originalname}"`);
    res.setHeader("Content-Type", file.mimetype);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(errorHandler(500, "Gagal mengunduh file"));
  }
};

// 🔹 Controller untuk menghapus file
export const deleteFile = async (req, res, next) => {
  try {
    const file = await Unduhan.findById(req.params.id);
    if (!file) {
      return next(errorHandler(404, "File tidak ditemukan"));
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(file.path));
    await fs.promises.unlink(filePath).catch(() => null);

    if (file.imagePath) {
      const imagePath = path.join(IMAGE_DIR, path.basename(file.imagePath));
      await fs.promises.unlink(imagePath).catch(() => null);
    }

    await Unduhan.findByIdAndDelete(req.params.id);
    res.json({ message: "File berhasil dihapus" });
  } catch (error) {
    next(errorHandler(500, "Gagal menghapus file"));
  }
};