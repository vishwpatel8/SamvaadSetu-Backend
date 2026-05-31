import { Router } from "express";

import {
  changePassword,
  deleteAccount,
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
import validate from "@src/middleware/validate.middleware";
import {
  changePasswordValidationSchema,
  deleteAccountValidationSchema,
  forgotPasswordValidationSchema,
  loginUserValidationSchema,
  registerUserValidationSchema,
  resetPasswordValidationSchema,
  toggleTwoFactorValidationSchema,
  verifyTwoFactorValidationSchema,
} from "@src/validation/user.validation";

const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate(registerUserValidationSchema),
  registerUser,
);

authRouter.post(
  "/login",
  authLimiter,
  validate(loginUserValidationSchema),
  loginUser,
);

authRouter.get("/me", authMiddleware, getCurrentUser);
authRouter.post("/logout", authMiddleware, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.get("/verify-email/:token", verifyEmail);
authRouter.post(
  "/resend-verification-email",
  authLimiter,
  resendVerificationEmail,
);

authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordValidationSchema),
  forgotPassword,
);

authRouter.post(
  "/reset-password/:token",
  authLimiter,
  validate(resetPasswordValidationSchema),
  resetPassword,
);

authRouter.post(
  "/2fa/verify",
  authLimiter,
  validate(verifyTwoFactorValidationSchema),
  verifyTwoFactor,
);
authRouter.post(
  "/enable-2fa",
  authMiddleware,
  authLimiter,
  validate(toggleTwoFactorValidationSchema),
  enableTwoFactor,
);
authRouter.post(
  "/disable-2fa",
  authMiddleware,
  authLimiter,
  validate(toggleTwoFactorValidationSchema),
  disableTwoFactor,
);
authRouter.post("/resend-2fa", authLimiter, resendTwoFactorCode);
authRouter.patch(
  "/change-password",
  authMiddleware,
  authLimiter,
  validate(changePasswordValidationSchema),
  changePassword,
);
authRouter.delete(
  "/delete-account",
  authMiddleware,
  authLimiter,
  validate(deleteAccountValidationSchema),
  deleteAccount,
);
export default authRouter;
