import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("✅ Google Profile:", profile);

        // Validasi email tersedia
        if (!profile.emails || !profile.emails.length) {
          return done(new Error("Email tidak tersedia dari Google"), null);
        }

        const user = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        };

        return done(null, user);
      } catch (error) {
        console.error("❌ Google strategy error:", error);
        return done(error, null);
      }
    }
  )
);

