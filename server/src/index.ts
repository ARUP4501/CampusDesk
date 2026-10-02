import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { classifierService } from "./services/classifier.service.js";
import { escalationService } from "./services/escalation.service.js";
import { authRouter } from "./routes/auth.routes.js";
import { ticketRouter } from "./routes/ticket.routes.js";
import { gatePassRouter } from "./routes/gatepass.routes.js";
import { noticeRouter } from "./routes/notice.routes.js";
import { academicRouter } from "./routes/academic.routes.js";
import { messRouter } from "./routes/mess.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { feeRouter } from "./routes/fee.routes.js";
import { faqRouter } from "./routes/faq.routes.js";
import { commandRouter } from "./routes/command.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { hostelRouter } from "./routes/hostel.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { importRouter } from "./routes/import.routes.js";
import { emergencyRouter } from "./routes/emergency.routes.js";
import { clubRouter } from "./routes/club.routes.js";
import { maintenanceRouter } from "./routes/maintenance.routes.js";
import { parcelRouter } from "./routes/parcel.routes.js";
import { transportRouter } from "./routes/transport.routes.js";
import { parkingRouter } from "./routes/parking.routes.js";
import { directoryRouter } from "./routes/directory.routes.js";
import { generalApiLimiter } from "./middleware/rateLimit.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and CORS configuration
const allowedOrigins = [
  config.APP_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/container environment
      }
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(generalApiLimiter);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    app: "CampusDesk",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/gatepass", gatePassRouter);
app.use("/api/notices", noticeRouter);
app.use("/api/academic", academicRouter);
app.use("/api/mess", messRouter);
app.use("/api/documents", documentRouter);
app.use("/api/fees", feeRouter);
app.use("/api/faq", faqRouter);
app.use("/api/commands", commandRouter);
app.use("/api/admin", adminRouter);
app.use("/api/hostels", hostelRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/import", importRouter);
app.use("/api/emergencies", emergencyRouter);
app.use("/api/clubs", clubRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/parcels", parcelRouter);
app.use("/api/transport", transportRouter);
app.use("/api/parking", parkingRouter);
app.use("/api/directory", directoryRouter);

// Serve static frontend assets strictly in production mode
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (config.NODE_ENV === "production" && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req: Request, res: Response) => {
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.join(clientDistPath, "index.html"));
    }
  });
} else {
  // In development, port 5000 is exclusively for API routes.
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      status: "online",
      service: "CampusDesk Backend API",
      environment: config.NODE_ENV,
      message: "API service is active. For the frontend web application, use Vite development server at http://localhost:5173",
      frontendUrl: config.APP_URL
    });
  });
}

// Start Server and Background Services
async function bootstrap() {
  try {
    // Train complaint classifier
    await classifierService.initialize();
    console.log("Complaint TF-IDF classifier initialized successfully.");

    // Start background escalation and reminder worker
    escalationService.start(60000); // Check every 60 seconds

    app.listen(config.PORT, () => {
      console.log(`CampusDesk server running on port ${config.PORT}`);
      console.log(`Base URL configured: ${config.APP_URL}`);
    });
  } catch (err) {
    console.error("Failed to bootstrap server:", err);
    process.exit(1);
  }
}

bootstrap();

export default app;
