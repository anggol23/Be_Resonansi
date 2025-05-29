import multer from "multer";
import { fileStorage } from "../utils/cloudinary.js";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

const upload = multer({ storage: fileStorage }).single("file");

export const publishFile = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(errorHandler(400, err.message || "Gagal upload file"));
    }

    try {
      if (!req.file) {
        return next(errorHandler(400, "File harus diunggah"));
      }

      if (!req.body.filename) {
        return next(errorHandler(400, "Nama file harus diisi"));
      }

      if (!req.body.imagePath) {
        return next(errorHandler(400, "Thumbnail wajib diisi"));
      }

      const newFile = new Unduhan({
        title: req.body.filename,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileUrl: req.file.path,
        imagePath: req.body.imagePath,
        uploadedBy: req.user ? req.user.id : null,
      });

      const saved = await newFile.save();
      res.status(201).json(saved);
    } catch (error) {
      next(errorHandler(500, "Gagal menyimpan file ke database"));
    }
  });
};
