import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 200),
  maxTextChars: Number(process.env.MAX_TEXT_CHARS || 200000),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || "",
      appSecret: process.env.FACEBOOK_APP_SECRET || "",
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/api/auth/facebook/callback"
    }
  },
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === "true",
    from: process.env.EMAIL_FROM || "noreply@reviewmegen.com"
  }
};
