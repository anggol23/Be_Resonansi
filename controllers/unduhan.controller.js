import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// 🔹 Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Storage Cloudinary khusus file (bukan gambar)
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "unduhan",
    resource_type: "raw",
    type: "upload",            
    format: async (req, file) => file.originalname.split(".").pop(),
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// 🔹 Middleware upload (hanya satu file)
const upload = multer({ storage: fileStorage }).single("file");

// 🔸 POST Upload file
export const publishFile = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return next(errorHandler(400, err.message || "Gagal mengunggah file"));
    }

    try {
      if (!req.file) return next(errorHandler(400, "File harus diunggah"));
      if (!req.body.filename) return next(errorHandler(400, "Nama file wajib diisi"));
      if (!req.body.imagePath) return next(errorHandler(400, "imagePath wajib diisi"));

      const newFile = new Unduhan({
        title: req.body.filename,
        filename: req.file.originalname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: req.file.path,        
        public_id: req.file.filename,   
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

// 🔸 GET Semua File (tanpa fileUrl)
export const getFiles = async (req, res, next) => {
  try {
    const files = await Unduhan.find({}, { public_id: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(files);
  } catch (error) {
    next(errorHandler(500, "Gagal mengambil daftar file"));
  }
};

// 🔸 GET Unduh File (redirect ke Cloudinary)
export const downloadFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await Unduhan.findById(fileId);
    if (!file) return res.status(404).json({ message: "File tidak ditemukan" });

    return res.redirect(file.fileUrl);
  } catch (error) {
    next(errorHandler(500, "Gagal mengunduh file"));
  }
};

// 🔸 DELETE Hapus File (dari DB dan Cloudinary)
export const deleteFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await Unduhan.findById(fileId);
    if (!file) return res.status(404).json({ message: "File tidak ditemukan" });

    // Hapus file dari Cloudinary pakai public_id & resource_type 'raw'
    await cloudinary.uploader.destroy(file.public_id, { resource_type: "raw" });

    // Hapus data file dari MongoDB
    await Unduhan.findByIdAndDelete(fileId);

    res.json({ message: "File berhasil dihapus" });
  } catch (error) {
    next(errorHandler(500, "Gagal menghapus file"));
  }
};
