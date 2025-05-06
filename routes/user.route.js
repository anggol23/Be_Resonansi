import express from 'express';
import {
  deleteUser,
  getUser,
  getUsers,
  signout,
  test,
  updateUser,
  getAllUsers,
  updateUserRole
} from '../controllers/user.controller.js';
import { verifyToken , verifyAdmin } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get('/test', test);
router.put('/update/:userId', verifyToken, updateUser);
router.delete("/delete/:id", verifyToken, verifyAdmin, deleteUser);
router.post('/signout', signout);
router.get("/getusers", verifyToken, verifyAdmin, getAllUsers);
router.get('/:userId', getUser);
router.put("/update-role/:userId", verifyToken, verifyAdmin, updateUserRole);


export default router;