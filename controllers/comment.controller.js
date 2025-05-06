import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// Membuat komentar
export const createComment = async (req, res, next) => {
  try {
    const { content, postId, userId } = req.body;

    if (!content || !postId || !userId) {
      return next(errorHandler(400, 'Content, postId, dan userId wajib diisi'));
    }

    if (userId !== req.user.id) {
      return next(errorHandler(403, 'Anda tidak diizinkan untuk membuat komentar ini'));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(errorHandler(404, 'Post tidak ditemukan'));
    }

    const newComment = new Comment({
      content,
      postId: post._id,
      userId,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

// Mendapatkan komentar berdasarkan slug
// Mengupdate fungsi getPostComments dengan penanganan token dan otorisasi
export const getPostComments = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return next(errorHandler(400, 'Slug harus diisi'));
    }

    const post = await Post.findOne({ slug });
    if (!post) {
      return next(errorHandler(404, 'Post tidak ditemukan'));
    }

    const comments = await Comment.find({ postId: post._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePicture')
      .lean();

    // Format komentar sebelum mengirim ke frontend
    const formattedComments = comments.map(comment => ({
      ...comment,
      username: comment.userId.username,
      profilePicture: comment.userId.profilePicture,
      userId: comment.userId._id,
    }));

    res.status(200).json(formattedComments);
  } catch (error) {
    next(error);
  }
};


// Menyukai atau membatalkan suka komentar
export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan'));
    }

    const userIndex = comment.likes.indexOf(req.user.id);
    const action = userIndex === -1 ? 'like' : 'unlike';

    if (action === 'like') {
      comment.numberOfLikes += 1;
      comment.likes.push(req.user.id);
    } else {
      comment.numberOfLikes -= 1;
      comment.likes.splice(userIndex, 1);
    }

    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

// Mengedit komentar
export const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan'));
    }

    // Validasi content input
    if (!req.body.content || req.body.content.trim().length === 0) {
      return next(errorHandler(400, 'Content komentar tidak boleh kosong'));
    }

    // Pastikan yang mengedit adalah pemilik komentar atau admin
    if (comment.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'Anda tidak diizinkan untuk mengedit komentar ini'));
    }

    // Edit komentar
    const editedComment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { content: req.body.content },
      { new: true } // Kembalikan data yang baru setelah update
    );

    res.status(200).json(editedComment);
  } catch (error) {
    next(error);
  }
};

// Menghapus komentar
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan'));
    }

    // Pastikan yang menghapus adalah pemilik komentar atau admin
    if (comment.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return next(errorHandler(403, 'Anda tidak diizinkan untuk menghapus komentar ini'));
    }

    // Hapus komentar
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: 'Komentar telah dihapus' });
  } catch (error) {
    next(error);
  }
};

// Mendapatkan semua komentar (hanya untuk admin)
export const getAllComments = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'Anda tidak diizinkan untuk melihat semua komentar'));
  }

  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'desc' ? -1 : 1;

    const comments = await Comment.find()
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .lean(); // Menggunakan .lean() untuk hasil yang lebih ringan

    const totalComments = await Comment.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({ comments, totalComments, lastMonthComments });
  } catch (error) {
    next(error);
  }
};
