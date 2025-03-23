import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://jurnalresonansi.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile);

        if (!profile) {
          return done(new Error("Google Profile is undefined"), null);
        }

        // Simpan user ke session
        const user = { googleId: profile.id, name: profile.displayName, email: profile.emails[0].value };

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
    // Simulasi ambil user dari database
    const user = { googleId: id, name: "User Example" }; 
    done(null, user);
});
