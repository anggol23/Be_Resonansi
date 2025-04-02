import express from 'express';
import { signup, signin, signout, getMe, google } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import passport from "passport";

const router = express.Router();

// Rute untuk registrasi pengguna
router.post('/signup', signup);

// Rute untuk login pengguna
router.post('/signin', signin);

// Rute untuk logout pengguna
router.post('/signout', signout);

// Rute untuk mendapatkan data pengguna saat ini
router.get('/me', verifyToken, getMe);

// Rute untuk login menggunakan Google
router.post('/google', google);

// Google OAuth dengan Passport.js
router.get("/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      console.log("✅ User after login:", req.user); 
      res.redirect("https://jurnalresonansi.com/");
    }
  );

export default router;
