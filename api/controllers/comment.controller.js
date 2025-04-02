import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import { errorHandler } from "../utils/errorHandler.js";

// Membuat komentar
export const createComment = async (req, res, next) => {
  try {
    const { content, postId, userId } = req.body;

    if (!content || !postId || !userId) {
      return next(errorHandler(400, 'Content, postId, dan userId wajib diisi.'));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(errorHandler(404, 'Post tidak ditemukan.'));
    }

    const newComment = new Comment({
      content,
      postId: post._id,
      userId,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    next(errorHandler(500, 'Gagal membuat komentar.'));
  }
};

// Mendapatkan komentar berdasarkan postId
export const getPostComments = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug });
    if (!post) {
      return next(errorHandler(404, 'Post tidak ditemukan.'));
    }

    const comments = await Comment.find({ postId: post._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePicture')
      .lean();

    res.status(200).json(comments);
  } catch (error) {
    next(errorHandler(500, 'Gagal mendapatkan komentar.'));
  }
};

// Menyukai atau membatalkan suka komentar
export const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan.'));
    }

    const userIndex = comment.likes.indexOf(req.user.id);
    if (userIndex === -1) {
      comment.likes.push(req.user.id);
      comment.numberOfLikes += 1;
    } else {
      comment.likes.splice(userIndex, 1);
      comment.numberOfLikes -= 1;
    }

    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    next(errorHandler(500, 'Gagal menyukai komentar.'));
  }
};

// Mengedit komentar
export const editComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(errorHandler(400, 'Content komentar tidak boleh kosong.'));
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan.'));
    }

    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(errorHandler(403, 'Anda tidak diizinkan untuk mengedit komentar ini.'));
    }

    comment.content = content;
    await comment.save();

    res.status(200).json(comment);
  } catch (error) {
    next(errorHandler(500, 'Gagal mengedit komentar.'));
  }
};

// Menghapus komentar
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return next(errorHandler(404, 'Komentar tidak ditemukan.'));
    }

    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(errorHandler(403, 'Anda tidak diizinkan untuk menghapus komentar ini.'));
    }

    await comment.remove();
    res.status(200).json({ message: 'Komentar berhasil dihapus.' });
  } catch (error) {
    next(errorHandler(500, 'Gagal menghapus komentar.'));
  }
};
