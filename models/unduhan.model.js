import mongoose from "mongoose";

const unduhanSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  fileUrl: String,
  public_id: String,
  imagePath: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model("Unduhan", unduhanSchema);
