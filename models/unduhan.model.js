import mongoose from 'mongoose';

const UnduhanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Judul file
    filename: { type: String, required: true }, // Nama file untuk download
    originalname: { type: String, required: true }, // Nama asli saat diupload
    mimetype: { type: String, required: true }, // Jenis MIME
    size: { type: Number, required: true }, // Ukuran file
    fileUrl: { type: String, required: true }, // URL dari Cloudinary
    imagePath: { type: String, required: true }, // URL thumbnail (bisa dari Cloudinary juga)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Unduhan', UnduhanSchema);
