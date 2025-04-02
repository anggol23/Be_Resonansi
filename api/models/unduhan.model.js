import mongoose from 'mongoose';

const unduhanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul file wajib diisi'],
    },
    filename: {
      type: String,
      required: [true, 'Nama file wajib diisi'],
    },
    originalname: {
      type: String,
      required: [true, 'Nama asli file wajib diisi'],
    },
    size: {
      type: Number,
      required: [true, 'Ukuran file wajib diisi'],
    },
    mimetype: {
      type: String,
      required: [true, 'Tipe file wajib diisi'],
    },
    path: {
      type: String,
      required: [true, 'Path file wajib diisi'],
    },
    imagePath: {
      type: String,
      default: null, // Gambar opsional
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Bisa null jika tidak ada pengguna yang mengunggah
    },
  },
  { timestamps: true }
);

// Index untuk optimisasi pencarian
unduhanSchema.index({ title: 1 });
unduhanSchema.index({ createdAt: -1 });

const Unduhan = mongoose.model('Unduhan', unduhanSchema);

export default Unduhan;
