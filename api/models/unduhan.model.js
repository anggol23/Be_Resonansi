import mongoose from 'mongoose';

const UnduhanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true, unique: true }, 
    originalname: { type: String, required: true }, 
    size: { type: Number, required: true }, 
    mimetype: { type: String, required: true }, 
    path: { type: String, required: true }, 
    imagePath: { type: String, required: true }, 
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
  },
  { timestamps: true }
);

export default mongoose.model('Unduhan', UnduhanSchema);
