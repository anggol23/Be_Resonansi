import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { errorHandler } from '../utils/errorHandler.js';
import Unduhan from '../models/unduhan.model.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const IMAGE_DIR = path.join(process.cwd(), 'images');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'image' ? IMAGE_DIR : UPLOADS_DIR;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Filter file berdasarkan tipe
const fileFilter = (req, file, cb) => {
  const fileTypes = ['application/pdf', 'application/msword', 'text/plain'];
  const imageTypes = ['image/jpeg', 'image/png'];

  if (file.fieldname === 'file' && fileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === 'image' && imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Format tidak diizinkan: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batasi ukuran file maksimal 5MB
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

// 🔹 Controller untuk mengunggah file
export const publishFile = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(errorHandler(400, err.message || 'Gagal mengunggah file'));
    }

    try {
      const uploadedFile = req.files?.file ? req.files.file[0] : null;
      const uploadedImage = req.files?.image ? req.files.image[0] : null;

      if (!uploadedFile) {
        return next(errorHandler(400, 'File harus diunggah'));
      }
      if (!req.body.filename) {
        return next(errorHandler(400, 'Nama file harus diisi'));
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
    next(errorHandler(500, 'Gagal mengambil data file'));
  }
};

// 🔹 Controller untuk mengunduh file
export const downloadFile = async (req, res, next) => {
  try {
    const file = await Unduhan.findById(req.params.id);
    if (!file) {
      return next(errorHandler(404, 'File tidak ditemukan'));
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(file.path));
    if (!fs.existsSync(filePath)) {
      return next(errorHandler(404, 'File tidak ditemukan di server'));
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
    res.setHeader('Content-Type', file.mimetype);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(errorHandler(500, 'Gagal mengunduh file'));
  }
};

// 🔹 Controller untuk menghapus file
export const deleteFile = async (req, res, next) => {
  try {
    const file = await Unduhan.findById(req.params.id);
    if (!file) {
      return next(errorHandler(404, 'File tidak ditemukan'));
    }

    const filePath = path.join(UPLOADS_DIR, path.basename(file.path));
    await fs.promises.unlink(filePath).catch(() => null);

    if (file.imagePath) {
      const imagePath = path.join(IMAGE_DIR, path.basename(file.imagePath));
      await fs.promises.unlink(imagePath).catch(() => null);
    }

    await Unduhan.findByIdAndDelete(req.params.id);
    res.json({ message: 'File berhasil dihapus' });
  } catch (error) {
    next(errorHandler(500, 'Gagal menghapus file'));
  }
};