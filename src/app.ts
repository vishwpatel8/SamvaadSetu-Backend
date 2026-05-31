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
// POST /api/v1/auth/change-password

// POST /api/v1/auth/2fa/verify                 ✅
// POST /api/v1/auth/2fa/enable                 ✅
// POST /api/v1/auth/2fa/disable                ✅
// POST /api/v1/auth/2fa/resend                 ✅

// User Session Profile
// GET /api/v1/auth/me                          ✅
// PATCH /api/v1/auth/update-profile

// Optional Check Email Availability
// GET /api/v1/auth/check-email
// POST /api/v1/auth/verify-password  // check before changing the enable disable 2fa.

// 3. Resend 2FA OTP endpoint
// 4. OTP attempt limiting
// 5. Validation middleware
// 6. Error middleware
// 7. Profile APIs
// 8. Chat functionality
