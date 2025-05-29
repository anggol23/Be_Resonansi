import multer from "multer";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// 🔹 Konfigurasi multer untuk simpan file ke memory
const storage = multer.memoryStorage();

// 🔹 Validasi jenis file yang diperbolehkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`⛔ Format tidak diizinkan: ${file.mimetype}`), false);
  }
};

// 🔹 Middleware upload (hanya satu file)
const upload = multer({ storage, fileFilter }).single("file");

// 🔹 Upload file (POST)
export const publishFile = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(errorHandler(400, err.message || "Gagal mengunggah file"));
    }

    try {
      if (!req.file) {
        return next(errorHandler(400, "File harus diunggah"));
      }
      if (!req.body.filename) {
        return next(errorHandler(400, "Nama file (title) harus diisi"));
      }
      if (!req.body.imagePath) {
        return next(errorHandler(400, "imagePath (Cloudinary URL) wajib diisi"));
      }

      const newFile = new Unduhan({
        title: req.body.filename,
        filename: req.file.originalname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileData: req.file.buffer,
        imagePath: req.body.imagePath,
        uploadedBy: req.user ? req.user.id : null,
});


      const savedFile = await newFile.save();
      res.status(201).json(savedFile);
    } catch (error) {
      next(errorHandler(500, "Gagal menyimpan file"));
    }
  });
};

// 🔹 Ambil daftar file (GET)
export const getFiles = async (req, res, next) => {
  try {
    const files = await Unduhan.find({}, { fileData: 0 }) // exclude fileData (berat)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(files);
  } catch (error) {
    next(errorHandler(500, "Gagal mengambil daftar file"));
  }
};

// 🔹 Unduh file (GET)
export const downloadFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await Unduhan.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File tidak ditemukan" });
    }

    res.set({
      "Content-Type": file.mimetype,
      "Content-Disposition": `attachment; filename="${file.originalname}"`,
      "Content-Length": file.size,
    });

    return res.send(file.fileData);
  } catch (error) {
    next(errorHandler(500, "Gagal mengunduh file"));
  }
};

// 🔹 Hapus file (DELETE)
export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await Unduhan.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File tidak ditemukan" });
    }

    await Unduhan.findByIdAndDelete(fileId);
    res.json({ message: "File berhasil dihapus" });
  } catch (error) {
    next(errorHandler(500, "Gagal menghapus file"));
  }
};
