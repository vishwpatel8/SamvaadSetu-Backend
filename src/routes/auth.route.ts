import { Router } from "express";

import {
  disableTwoFactor,
  enableTwoFactor,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendTwoFactorCode,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  verifyTwoFactor,
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
authRouter.post("/2fa/verify", authLimiter, verifyTwoFactor);
authRouter.post("/enable-2fa", authMiddleware, authLimiter, enableTwoFactor);
authRouter.post("/disable-2fa", authMiddleware, authLimiter, disableTwoFactor);
authRouter.post("/resend-2fa", authLimiter, resendTwoFactorCode);

export default authRouter;
