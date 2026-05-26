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
// POST /api/v1/auth/register                   // done
// POST /api/v1/auth/verify-email               // done
// POST /api/v1/auth/resend-verification-email  // done
// POST /api/v1/auth/login                      // done
// POST /api/v1/auth/verify-2fa-login
// POST /api/v1/auth/refresh-token              // done
// POST /api/v1/auth/logout                     // done

// POST /api/v1/auth/forgot-password            // done
// POST /api/v1/auth/reset-password             // done
// POST /api/v1/auth/change-password

// POST /api/v1/auth/2fa/generate
// POST /api/v1/auth/2fa/enable
// POST /api/v1/auth/2fa/disable
// POST /api/v1/auth/2fa/verify

// User Session Profile
// GET /api/v1/auth/me                          // done
// PATCH /api/v1/auth/update-profile

// Optional Check Email Availability
// GET /api/v1/auth/check-email
// POST /api/v1/auth/verify-password  // check before changing the enable disable 2fa.
