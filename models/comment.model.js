import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minlength: [1, 'Konten komentar tidak boleh kosong'],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId, // Menggunakan ObjectId untuk konsistensi
      ref: 'Post',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    numberOfLikes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index untuk postId dan userId untuk optimisasi pencarian
commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });

// Virtual untuk referensi ke user (untuk menghindari populate yang berulang)
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Validasi untuk memastikan numberOfLikes tidak negatif
commentSchema.pre('save', function (next) {
  if (this.numberOfLikes < 0) {
    this.numberOfLikes = 0;
  }
  next();
});

// Menghindari duplikat ID dalam likes array
commentSchema.pre('save', function (next) {
  this.likes = [...new Set(this.likes)]; // Hapus duplikat ID
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
