import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import expressWinston from "express-winston";
import { logger } from "./services/logger";
import { logMemoryUsage } from "./utils/memoryLogger";

import billingRoutes from "./routes/billingRoutes";
import userRoutes from "./routes/userRoutes";
import transferRoutes from './routes/transferRoutes';

const app: Application = express();

// Log memory on startup
logMemoryUsage();

// Enable CORS (adjust origins in production)
app.use(cors({ origin: "*" }));

// HTTP request logs
app.use(morgan("combined"));

// Structured logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    colorize: true,
    expressFormat: true,
  })
);

// Health check
app.get("/", (_req, res) => res.json({ status: "Wallet service is running" }));

// JSON parsing (skip webhook)
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/webhook") return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/api/v1", billingRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", transferRoutes);

// Error logging
app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: any) => {
  logger.error(err.stack || err.message || err);
  res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
});

export default app;
