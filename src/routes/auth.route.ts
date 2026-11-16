// import { Router } from "express";

// import {
//   changePassword,
//   deleteAccount,
//   disableTwoFactor,
//   enableTwoFactor,
//   forgotPassword,
//   getCurrentUser,
//   loginUser,
//   logoutUser,
//   refreshAccessToken,
//   registerUser,
//   resendTwoFactorCode,
//   resendVerificationEmail,
//   resetPassword,
//   updateProfile,
//   verifyEmail,
//   verifyTwoFactor,
// } from "../controllers/auth.controller.js";

// import authMiddleware from "../middleware/auth.middleware.js";
// import authLimiter from "../middleware/rateLimiter.middleware.js";
// import validate from "../middleware/validate.middleware.js";
// import {
//   changePasswordValidationSchema,
//   deleteAccountValidationSchema,
//   forgotPasswordValidationSchema,
//   loginUserValidationSchema,
//   registerUserValidationSchema,
//   resetPasswordValidationSchema,
//   toggleTwoFactorValidationSchema,
//   updateProfileValidationSchema,
//   verifyTwoFactorValidationSchema,
// } from "../validation/user.validation.js";

// const authRouter = Router();

// authRouter.post(
//   "/register",
//   authLimiter,
//   validate(registerUserValidationSchema),
//   registerUser,
// );

// authRouter.post(
//   "/login",
//   authLimiter,
//   validate(loginUserValidationSchema),
//   loginUser,
// );

// authRouter.get("/me", authMiddleware, getCurrentUser);
// authRouter.post("/logout", authMiddleware, logoutUser);
// authRouter.post("/refresh-token", refreshAccessToken);
// authRouter.get("/verify-email/:token", verifyEmail);
// authRouter.post(
//   "/resend-verification-email",
//   authLimiter,
//   resendVerificationEmail,
// );

// authRouter.post(
//   "/forgot-password",
//   authLimiter,
//   validate(forgotPasswordValidationSchema),
//   forgotPassword,
// );

// authRouter.post(
//   "/reset-password/:token",
//   authLimiter,
//   validate(resetPasswordValidationSchema),
//   resetPassword,
// );

// authRouter.post(
//   "/2fa/verify",
//   authLimiter,
//   validate(verifyTwoFactorValidationSchema),
//   verifyTwoFactor,
// );
// authRouter.post(
//   "/enable-2fa",
//   authMiddleware,
//   authLimiter,
//   validate(toggleTwoFactorValidationSchema),
//   enableTwoFactor,
// );
// authRouter.post(
//   "/disable-2fa",
//   authMiddleware,
//   authLimiter,
//   validate(toggleTwoFactorValidationSchema),
//   disableTwoFactor,
// );
// authRouter.post("/resend-2fa", authLimiter, resendTwoFactorCode);
// authRouter.patch(
//   "/change-password",
//   authMiddleware,
//   authLimiter,
//   validate(changePasswordValidationSchema),
//   changePassword,
// );
// authRouter.delete(
//   "/delete-account",
//   authMiddleware,
//   authLimiter,
//   validate(deleteAccountValidationSchema),
//   deleteAccount,
// );
// authRouter.patch(
//   "/update-profile",
//   authMiddleware,
//   authLimiter,
//   validate(updateProfileValidationSchema),
//   updateProfile,
// );
// export default authRouter;
