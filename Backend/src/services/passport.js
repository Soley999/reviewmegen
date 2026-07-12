import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { config } from "../config.js";
import { findUserByEmail, createUser, getUserById } from "./storage.js";
import { nanoid } from "nanoid";

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email provided by Google. Please ensure email permissions are granted."), null);
          }

          const trimmedEmail = email.trim().toLowerCase();

          // Check if user exists
          let user = await findUserByEmail(trimmedEmail);

          if (!user) {
            // Create new user
            user = await createUser({
              email: trimmedEmail,
              name: profile.displayName || email.split("@")[0],
              passwordHash: nanoid(), // Random hash for OAuth users
              provider: "google",
              providerId: profile.id
            });
          } else if (user.provider && user.provider !== "google" && user.providerId) {
            return done(new Error(`This email is already registered with ${user.provider}. Please login using ${user.provider}.`), null);
          }

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (config.oauth.facebook.appId && config.oauth.facebook.appSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.oauth.facebook.appId,
        clientSecret: config.oauth.facebook.appSecret,
        callbackURL: config.oauth.facebook.callbackURL,
        profileFields: ["id", "displayName", "emails", "name"]
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email provided by Facebook. Please ensure email permissions are granted."), null);
          }

          const trimmedEmail = email.trim().toLowerCase();

          // Check if user exists
          let user = await findUserByEmail(trimmedEmail);

          if (!user) {
            // Create new user
            user = await createUser({
              email: trimmedEmail,
              name: profile.displayName || email.split("@")[0],
              passwordHash: nanoid(), // Random hash for OAuth users
              provider: "facebook",
              providerId: profile.id
            });
          } else if (user.provider && user.provider !== "facebook" && user.providerId) {
            return done(new Error(`This email is already registered with ${user.provider}. Please login using ${user.provider}.`), null);
          }

          return done(null, user);
        } catch (error) {
          console.error("Facebook OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
}

export default passport;
