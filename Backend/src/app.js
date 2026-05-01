import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import processRoutes from "./routes/process.js";
import reviewerRoutes from "./routes/reviewers.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 80
    })
  );

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/process", processRoutes);
  app.use("/api/reviewers", reviewerRoutes);

  app.use(errorHandler);

  return app;
}
