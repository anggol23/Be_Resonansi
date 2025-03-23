import express from "express";
import { signup, signin, google, getMe } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import passport from "passport";

const router = express.Router();

// Route untuk Signup dan Signin
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google", google);
router.get("/me", verifyToken, getMe);

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
