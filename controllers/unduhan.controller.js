import multer from "multer";
import Unduhan from "../models/unduhan.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// 🔹 Ganti storage multer ke memoryStorage supaya file disimpan di memory sebagai buffer
const storage = multer.memoryStorage();

// 🔹 Filter jenis file yang diizinkan
const fileFilter = (req, file, cb) => {
  console.log("📂 Upload:", file.originalname, "📝 MIME:", file.mimetype);

  const fileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ];
  // Kalau kamu ingin upload image juga, tambahkan tipe image di sini dan sesuaikan
  if (fileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error("⛔ Format tidak diizinkan:", file.mimetype);
    cb(new Error(`Format tidak diizinkan: ${file.mimetype}`), false);
  }
};

// 🔹 Middleware upload file, hanya satu file dengan fieldname "file"
const upload = multer({ storage, fileFilter }).single("file");

// 🔹 Controller upload file ke MongoDB (simpan file langsung di DB dalam bentuk Buffer)
export const publishFile = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("⛔ Multer error:", err);
      return next(errorHandler(400, err.message || "Gagal mengunggah file"));
    }

    try {
      if (!req.file) {
        return next(errorHandler(400, "File harus diunggah"));
      }
      if (!req.body.filename) {
        return next(errorHandler(400, "Nama file harus diisi"));
      }

      const newFile = new Unduhan({
        title: req.body.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileData: req.file.buffer, // Simpan file di field Buffer
        uploadedBy: req.user ? req.user.id : null,
      });

      const savedFile = await newFile.save();
      res.status(201).json(savedFile);
    } catch (error) {
      next(error);
    }
  });
};

// 🔹 Controller ambil list file tanpa field fileData agar response tidak berat
export const getFiles = async (req, res, next) => {
  try {
    const files = await Unduhan.find({}, { fileData: 0 }).sort({ createdAt: -1 }).lean();
    res.status(200).json(files);
  } catch (error) {
    next(errorHandler(500, "Gagal mengambil daftar file"));
  }
};

// 🔹 Controller download file (ambil langsung dari MongoDB)
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
    console.error("⛔ Error saat mengunduh file:", error);
    next(errorHandler(500, "Terjadi kesalahan saat mengunduh file"));
  }
};

// 🔹 Controller hapus file dari MongoDB (tidak ada file di disk)
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
    next(error);
  }
};
