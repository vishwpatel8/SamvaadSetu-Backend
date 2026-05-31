import express from "express";

// Middleware packages
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Routes
import authRouter from "@src/routes/auth.route";

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URI, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/v1/auth", authRouter);

export default app;

//  All Auth Routes
// POST /api/v1/auth/register                   ✅
// POST /api/v1/auth/verify-emai/:token         ✅
// POST /api/v1/auth/resend-verification-email  ✅
// POST /api/v1/auth/login                      ✅
// POST /api/v1/auth/refresh-token              ✅
// POST /api/v1/auth/logout                     ✅

// POST /api/v1/auth/forgot-password            ✅
// POST /api/v1/auth/reset-password/:token      ✅
// POST /api/v1/auth/change-password            ✅

// POST /api/v1/auth/2fa/verify                 ✅
// POST /api/v1/auth/2fa/enable                 ✅
// POST /api/v1/auth/2fa/disable                ✅
// POST /api/v1/auth/2fa/resend                 ✅

// User Session Profile
// GET /api/v1/auth/me                          ✅
// PATCH /api/v1/auth/update-profile            ✅
// POST /api/v1/auth/delete-account             ✅
// POST /api/v1/auth/recover-account

// 1. Update Profile
// 3. Conversation Model
// 4. Message Model
// 5. Socket.io Integration
// 7. Profile APIs
// 8. Chat functionality

// 1. Conversation Schema
// 2. Message Schema
// 3. Socket.IO Setup
// 4. Online/Offline Presence
// 5. Real-time Messaging
// 6. Read Receipts
