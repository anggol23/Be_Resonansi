import express from 'express';
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";
import { create, deletepost, getposts, updatepost , getPostBySlug , getPostById } from '../controllers/post.controller.js';

const router = express.Router();

router.post('/create', verifyToken, verifyAdmin, create); 
router.get('/getposts', getposts);
router.get('/getpost/:postId', getPostById);
router.delete("/deleteposts/:postId", verifyToken, deletepost);
router.put('/update/:postId', verifyToken, verifyAdmin, updatepost);
router.get('/post/:slug', getPostBySlug);


export default router;
