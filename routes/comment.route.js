import express from 'express';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { check, validationResult } from 'express-validator';
import {
  createComment,
  deleteComment,
  editComment,
  getPostComments,
  getAllComments, // Ganti getcomments menjadi getAllComments
  likeComment,
} from '../controllers/comment.controller.js';
import { errorHandler } from '../utils/errorHandler.js';

const router = express.Router();

// Middleware validasi komentar
const validateCreateComment = [
  check('content', 'Content harus diisi').notEmpty(),
  check('postId', 'PostId harus valid').isMongoId(), 
  check('userId', 'UserId harus valid').isMongoId(), 
];

// Validasi ID komentar
const validateCommentId = [
  check('commentId', 'CommentId harus valid').isMongoId(),
];

// Middleware untuk menangani error validasi
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(errorHandler(400, 'Input tidak valid', errors.array()));
  }
  next();
};

// Middleware untuk memastikan hanya admin yang bisa mengakses rute tertentu
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(errorHandler(403, 'Anda tidak diizinkan untuk melihat semua komentar'));
  }
  next();
};

// Rute untuk membuat komentar
router.post('/create', verifyToken, validateCreateComment, handleValidationErrors, createComment);

// Mendapatkan komentar berdasarkan slug
router.get('/getPostComments/:slug', [
  check('slug', 'Slug harus valid').isString(),
  handleValidationErrors
], getPostComments);

// Menyukai atau membatalkan suka komentar
router.patch('/likeComment/:commentId', verifyToken, validateCommentId, handleValidationErrors, likeComment);

// Mengedit komentar
router.put('/editComment/:commentId', verifyToken, validateCommentId, handleValidationErrors, editComment);

// Menghapus komentar
router.delete('/deleteComment/:commentId', verifyToken, validateCommentId, handleValidationErrors, deleteComment);

// Mendapatkan semua komentar (hanya untuk admin)
router.get('/comments', verifyToken, isAdmin, getAllComments); // Ganti getcomments menjadi getAllComments

export default router;
