import { Router } from "express";

import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "@src/controllers/auth.controller";

import authMiddleware from "@src/middleware/auth.middleware";
import authLimiter from "@src/middleware/rateLimiter.middleware";

const authRouter = Router();

authRouter.post("/register", authLimiter, registerUser);
authRouter.post("/login", authLimiter, loginUser);
authRouter.get("/me", authMiddleware, getCurrentUser);
authRouter.post("/logout", authMiddleware, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.get("/verify-email/:token", verifyEmail);
authRouter.post(
  "/resend-verification-email",
  authLimiter,
  resendVerificationEmail,
);
authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/reset-password/:token", authLimiter, resetPassword);

export default authRouter;
