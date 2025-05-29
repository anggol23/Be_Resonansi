import mongoose from 'mongoose';

const UnduhanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Judul file untuk tampilan
    filename: { type: String, required: true }, // Nama file untuk tampilan/download
    originalname: { type: String, required: true }, // Nama file saat diupload
    mimetype: { type: String, required: true }, // Jenis MIME (pdf, docx, dll)
    size: { type: Number, required: true }, // Ukuran file
    fileData: { type: Buffer, required: true }, // Isi file langsung di MongoDB
    imagePath: { type: String, required: true }, // Path untuk gambar preview (misal dari CDN atau upload terpisah)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Unduhan', UnduhanSchema);
