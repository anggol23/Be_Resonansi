import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { signup, signin, getMe } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", verifyToken, getMe);

// 🔐 Redirect ke Google
router.get("/google", 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔁 Callback dari Google
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    const { googleId, name, email } = req.user;

    if (!email) {
      console.error("❌ Email tidak tersedia", req.user);
      return res.redirect(`${process.env.CLIENT_URL}/sign-in?error=google-no-email`);
    }

    try {
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          username: name,
          email,
          googleId,
          authProvider: "google",
          profilePicture: "", 
          role: "user",
          password: await bcrypt.hash("google-auth-user", 10),
        });
        await user.save();
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
    } catch (err) {
      console.error("Google login error:", err);
      res.redirect(`${process.env.CLIENT_URL}/sign-in?error=google`);
    }
  }
);






export default router;
