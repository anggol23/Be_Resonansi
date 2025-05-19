import Post from '../models/post.model.js';
import { errorHandler } from '../utils/errorHandler.js';
import User from '../models/user.model.js';


// Kategori yang diizinkan
const allowedCategories = ['pendidikan', 'sosial', 'ekonomi', 'politik', 'cerpen', 'puisi'];

// 📝 CREATE POST
export const create = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(errorHandler(403, 'You are not allowed to create a post'));
    }

    const { title, content, category, image } = req.body;

    if (!title || !content || !category || !image) {
      return next(errorHandler(400, 'Please provide all required fields, including image'));
    }

    if (!allowedCategories.includes(category)) {
      return next(errorHandler(400, 'Invalid category'));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const slug = title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

    const newPost = new Post({
      title,
      content,
      category,
      image,
      slug,
      userId: req.user.id,
      authorName: user.username,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

// 📌 GET POST BY SLUG
// 📌 GET POST BY SLUG (with previous and next post)
export const getPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug }).lean(); // 🔹 Gunakan lean() untuk optimasi

    if (!post) {
      return next(errorHandler(404, "Post not found"));
    }

    // Cari artikel sebelumnya (lebih tua dari artikel yang sedang dilihat)
    const previousPost = await Post.findOne({ createdAt: { $lt: post.createdAt } })
      .sort({ createdAt: -1 }) // Urutkan berdasarkan tanggal terbaru
      .limit(1);

    // Cari artikel berikutnya (lebih baru dari artikel yang sedang dilihat)
    const nextPost = await Post.findOne({ createdAt: { $gt: post.createdAt } })
      .sort({ createdAt: 1 }) // Urutkan berdasarkan tanggal terbaru
      .limit(1);

    // Kirimkan artikel yang sedang dibaca, artikel sebelumnya, dan artikel berikutnya
    res.status(200).json({
      post,
      previous: previousPost ? { title: previousPost.title, slug: previousPost.slug } : null,
      next: nextPost ? { title: nextPost.title, slug: nextPost.slug } : null,
    });
  } catch (error) {
    next(error);
  }
};


export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 GET ALL POSTS (with filters)
export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    const filter = {
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      ...(req.query.searchTerm && {
        $or: [
          { title: { $regex: req.query.searchTerm, $options: 'i' } },
          { content: { $regex: req.query.searchTerm, $options: 'i' } },
        ],
      }),
    };

    const posts = await Post.find(filter)
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .select('-__v') // 🔹 Jangan kembalikan field __v (versi mongoose)
      .lean();

    const totalPosts = await Post.countDocuments(filter);

    // Hitung jumlah post dalam 1 bulan terakhir
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    res.status(200).json({ posts, totalPosts, lastMonthPosts });
  } catch (error) {
    next(error);
  }
};

// 🚀 DELETE POST
export const deletepost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    // Admin boleh hapus post siapa saja, user hanya boleh hapus miliknya sendiri
    if (req.user.role !== "admin" && req.user.id !== post.userId.toString()) {
      return next(errorHandler(403, 'You are not allowed to delete this post'));
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'The post has been deleted' });
  } catch (error) {
    next(error);
  }
};

// ✏️ UPDATE POST
export const updatepost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content, category, image } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return next(errorHandler(404, 'Post not found'));
    }

    // Admin boleh edit post siapa saja, user hanya boleh edit miliknya sendiri
    if (req.user.role !== "admin" && req.user.id !== post.userId.toString()) {
      return next(errorHandler(403, 'You are not allowed to update this post'));
    }

    // Validasi kategori saat update
    if (category && !allowedCategories.includes(category)) {
      return next(errorHandler(400, 'Invalid category'));
    }

    // Pastikan ada field yang diperbarui
    if (!title && !content && !category && !image) {
      return next(errorHandler(400, 'At least one field must be updated'));
    }

    // Update slug jika title berubah
    const newSlug = title ? title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') : post.slug;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: { title, content, category, image, slug: newSlug } },
      { new: true, runValidators: true } // 🔹 Pastikan validasi berjalan saat update
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};
