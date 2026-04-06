import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { adminRateLimiter, claimsRateLimiter } from "./middleware/rateLimit.js";
import publicRoutes from "./routes/publicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS_NOT_ALLOWED"));
    }
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});

app.use(express.json({ limit: "16kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/claims", claimsRateLimiter);
app.use("/api/admin", adminRateLimiter);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
