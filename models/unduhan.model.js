import mongoose from 'mongoose';

const UnduhanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Judul file untuk tampilan
    originalname: { type: String, required: true }, // Nama asli file saat diupload
    mimetype: { type: String, required: true }, // Jenis MIME (application/pdf, dsb.)
    size: { type: Number, required: true }, // Ukuran file dalam byte
    fileData: { type: Buffer, required: true }, // 🔄 ISI FILE disimpan langsung
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }, 
  },
  { timestamps: true }
);

export default mongoose.model('Unduhan', UnduhanSchema);
