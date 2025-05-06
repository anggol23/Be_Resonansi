import mongoose from 'mongoose';

const UnduhanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Judul untuk tampilan di UI
    filename: { type: String, required: true, unique: true }, // Nama file unik
    originalname: { type: String, required: true }, // Nama asli dari file
    size: { type: Number, required: true }, // Ukuran file dalam bytes
    mimetype: { type: String, required: true }, // Jenis file (image/pdf/etc)
    path: { type: String, required: true }, // Path untuk mengakses file
    imagePath: { type: String, required: true }, // Path untuk gambar terkait
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Bisa null jika upload anonim
  },
  { timestamps: true }
);

export default mongoose.model('Unduhan', UnduhanSchema);
