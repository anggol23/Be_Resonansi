import express from "express";
import { publishFile, getFiles, deleteFile, downloadFile } from "../controllers/unduhan.controller.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

router.get("/", verifyToken, getFiles); 
router.post("/upload", verifyToken, publishFile); 
router.delete("/:id", verifyToken, verifyAdmin, deleteFile); 
router.get("/download/:id", verifyToken, downloadFile); 

export default router;
