import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul wajib diisi'],
      minlength: [5, 'Judul minimal 5 karakter'],
      maxlength: [100, 'Judul maksimal 100 karakter'],
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Konten wajib diisi'],
      minlength: [20, 'Konten minimal 20 karakter'],
    },
    category: {
      type: String,
      enum: ['pendidikan', 'sosial', 'ekonomi', 'politik'],
      required: [true, 'Kategori wajib diisi'],
    },
    image: {
      type: String,
      required: [true, 'Gambar wajib diunggah'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Middleware untuk membuat slug otomatis sebelum menyimpan
postSchema.pre('validate', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }
  next();
});

// Index untuk optimisasi pencarian
postSchema.index({ slug: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
