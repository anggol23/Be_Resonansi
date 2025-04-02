import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rute untuk membuat postingan (hanya untuk admin)
router.post('/create', verifyToken, verifyAdmin, createPost);

// Rute untuk mendapatkan semua postingan
router.get('/getposts', getPosts);

// Rute untuk mendapatkan postingan berdasarkan ID
router.get('/getpost/:postId', getPostById);

// Rute untuk mendapatkan postingan berdasarkan slug
router.get('/post/:slug', getPostBySlug);

// Rute untuk memperbarui postingan (hanya untuk admin atau pemilik postingan)
router.put('/update/:postId', verifyToken, updatePost);

// Rute untuk menghapus postingan (hanya untuk admin atau pemilik postingan)
router.delete('/delete/:postId', verifyToken, deletePost);

export default router;
