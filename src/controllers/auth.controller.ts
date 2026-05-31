import crypto from "crypto";
import type { Request, Response } from "express";

// User Model and Validation
import User from "@src/model/user.model";
import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  loginUserValidationSchema,
  registerUserValidationSchema,
  resetPasswordValidationSchema,
  toggleTwoFactorValidationSchema,
  verifyTwoFactorValidationSchema,
} from "@src/validation/user.validation";

// Utilities
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setTwoFactorTokenCookie,
} from "@src/utils/cookies";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTwoFactorToken,
  verifyRefreshToken,
  verifyTwoFactorToken,
} from "@src/utils/jwt";
import { generateOTP } from "@src/utils/otp";
import { comparePassword, hashPassword } from "@src/utils/password";
import sendEmail from "@src/utils/sendEmail";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    //STEP 1:-Validate request body
    const validationResult = registerUserValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });

      return;
    }

    const { username, email, password } = validationResult.data;

    // STEP 2:- Check existing email
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      res.status(409).json({
        success: false,
        message: "Email already exists",
      });

      return;
    }

    // STEP 3:- Check existing username
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      res.status(409).json({
        success: false,
        message: "Username already taken",
      });

      return;
    }

    // STEP 4:- Hash password
    const hashedPassword = await hashPassword(password);

    //STEP 5:- Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // STEP 6:- Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,

      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60),
      isEmailVerified: false,
    });

    // STEP 7:- Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // STEP 8:- Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Extra Step:- Send verification email (optional but recommended)
    const verificationURL = `${process.env.CLIENT_URI}/verify-email/${emailVerificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email",
      html: ` <h2>Email Verification</h2>
      <p>Click the button below to verify your account.</p>
      <a href="${verificationURL}" style=" padding:10px 20px; background:black; color:white; text-decoration:none; border-radius:5px;">
      Verify Email </a> `,
    });

    // STEP 9:- Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // STEP 10:-Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    //STEP 1:- Validate request body
    const validationResult = loginUserValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,

        errors: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    const { email, password } = validationResult.data;

    //STEP 2:- Find user with password
    const user = await User.findOne({
      email,
    }).select("+password +refreshToken");

    // STEP 3:- Prevent email enumeration
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

      return;
    }

    // STEP 4:- Check account status
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account is disabled",
      });

      return;
    }

    // STEP 5:- Check account lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      res.status(423).json({
        success: false,
        message: "Account temporarily locked. Try again later.",
      });

      return;
    }

    // STEP 6:- Compare password
    const isPasswordCorrect = await comparePassword(password, user.password);

    // STEP 7:- Handle failed login
    if (!isPasswordCorrect) {
      user.loginAttempts += 1;

      // Lock after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
      }

      await user.save();
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

      return;
    }

    //STEP 8:-Reset failed login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // STEP 9:- Verify email
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
      return;
    }

    // STEP 10:- Handle 2FA requirement
    if (user.twoFactorEnabled) {
      try {
        const otp = generateOTP(); // Generate OTP
        const hashedOTP = await hashPassword(otp); // Hash OTP before storing

        const twoFactorToken = generateTwoFactorToken(user._id.toString()); // Generate temporary 2FA session token

        user.twoFactorCode = hashedOTP; // Store OTP details
        user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000);

        // Reset OTP attempts counter (if using one)
        user.twoFactorAttempts = 0;
        await user.save();

        // Send OTP email
        await sendEmail({
          to: user.email,
          subject: "Your Login Verification Code",
          html: `
        <h2>Login Verification</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not attempt to log in, please ignore this email.</p>
      `,
        });

        setTwoFactorTokenCookie(res, twoFactorToken);
        res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: "Verification code sent to email",
        });

        return;
      } catch (error) {
        console.error("2FA login error:", error);
        // Clean up OTP if email sending fails
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpires = undefined;
        user.twoFactorAttempts = 0;
        await user.save();
        res.status(500).json({
          success: false,
          message: "Failed to send verification code",
        });

        return;
      }
    }
    //STEP 11:- Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //STEP 12:- Save refresh token
    user.refreshToken = refreshToken;

    // STEP 13:- Update login info
    user.lastLogin = new Date();
    await user.save();

    // STEP 14:- Set cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // STEP 15:- Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // User already attached by auth middleware
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });

      return;
    }

    res.status(200).json({
      success: true,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // User already attached - by auth middleware
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });

      return;
    }

    // Remove refresh token
    user.refreshToken = undefined;
    await user.save();

    // Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // STEP 1:- Read refresh token from cookies
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });

      return;
    }

    // STEP 2:- Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // STEP 3:- Find user
    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    // STEP 4:- Check active account
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account disabled",
      });

      return;
    }

    // STEP 5:- Compare stored refresh token
    if (user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });

      return;
    }

    // STEP 6:- Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // STEP 7:- Rotate refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // STEP 8:- Set new cookies
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    // STEP 9:- Success response
    res.status(200).json({
      success: true,
      message: "Access token refreshed",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;

    // Find matching user
    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });

      return;
    }

    // Check token expiry
    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "Verification token expired",
      });

      return;
    }

    //Mark verified
    user.isEmailVerified = true;

    //Remove verification data
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // STEP 1:- Validate email
    const email = req.body.email?.trim();

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });

      return;
    }

    // STEP 2:- Find user
    const user = await User.findOne({ email });

    // Prevent email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: "If the email exists, a verification email has been sent",
      });

      return;
    }

    // STEP 3:- Check already verified
    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: "Email already verified",
      });

      return;
    }

    // STEP 4:- Generate new token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // STEP 5:- Set new expiry
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60);
    await user.save();

    // STEP 6:- Create verification URL
    const verificationURL = `${process.env.CLIENT_URI}/verify-email/${emailVerificationToken}`;

    // STEP 7:- Send email
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email",
        html: `
          <h2>Email Verification</h2>
          <p>Click below to verify your account.</p>
          <a href="${verificationURL}" style="padding:10px 20px;background:black;color:white;text-decoration:none;border-radius:5px; ">
            Verify Email
          </a>
        `,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });

      return;
    }

    // STEP 8:- Success response
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // STEP 1:- Validate request
    const validationResult = forgotPasswordValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });

      return;
    }

    const { email } = validationResult.data;

    // STEP 2:- Find user
    const user = await User.findOne({
      email,
    });

    // Prevent email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });

      return;
    }

    // STEP 3:- Generate reset token
    const passwordResetToken = crypto.randomBytes(32).toString("hex");

    // STEP 4:- Set expiry
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 15);
    await user.save();

    //STEP 5:- Generate reset URL
    const resetURL = `${process.env.CLIENT_URI}/reset-password/${passwordResetToken}`;

    // STEP 6:- Send email
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset Your Password",
        html: `
          <h2>Password Reset</h2>
          <p> Click below to reset your password.</p>

          <a href="${resetURL}" tyle=" padding:10px 20px; background:black;color:white;text-decoration:none;border-radius:5px;">
            Reset Password
          </a>
        `,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      res.status(500).json({
        success: false,
        message: "Failed to send reset email",
      });

      return;
    }

    // STEP 7:- Success response
    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // STEP 1:- Validate password
    const validationResult = resetPasswordValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });
      return;
    }

    const { password } = validationResult.data;
    const { token } = req.params;

    // STEP 2:- Find matching user
    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid password reset token",
      });
      return;
    }

    // STEP 3:- Check expiry
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: "Password reset token expired",
      });
      return;
    }

    // STEP 4:- Hash new password
    const hashedPassword = await hashPassword(password);

    // STEP 5:- Update password
    user.password = hashedPassword;

    // STEP 6:- Remove reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // STEP 7:- Invalidate old sessions
    user.refreshToken = undefined;

    // STEP 8:- Track password change
    user.lastPasswordChangedAt = new Date();
    await user.save();

    // STEP 9:- Clear cookies
    clearAuthCookies(res);

    // STEP 10:- Success response
    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validationResult = verifyTwoFactorValidationSchema.safeParse(
      req.body,
    );

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });

      return;
    }

    const { otp } = validationResult.data;

    const twoFactorToken = req.cookies.twoFactorToken;
    if (!twoFactorToken) {
      res.status(401).json({
        success: false,
        message: "2FA session expired",
      });

      return;
    }
    let decoded;

    try {
      decoded = verifyTwoFactorToken(twoFactorToken);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired 2FA session",
      });

      return;
    }

    const user = await User.findById(decoded.userId).select(
      "+refreshToken +twoFactorCode +twoFactorCodeExpires",
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpires) {
      res.status(400).json({
        success: false,
        message: "No verification code found",
      });

      return;
    }

    if (user.twoFactorCodeExpires < new Date()) {
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpires = undefined;
      await user.save();
      res.status(400).json({
        success: false,
        message: "Verification code expired",
      });

      return;
    }

    const isOTPValid = await comparePassword(otp, user.twoFactorCode);

    if (!isOTPValid) {
      res.status(401).json({
        success: false,
        message: "Invalid verification code",
      });

      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    user.lastLogin = new Date();

    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const enableTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validationResult = toggleTwoFactorValidationSchema.safeParse(
      req.body,
    );

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });

      return;
    }

    const { password } = validationResult.data;

    const authUser = req.user;

    if (!authUser) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const user = await User.findById(authUser._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      });

      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: "Verify your email before enabling 2FA",
      });

      return;
    }

    if (user.twoFactorEnabled) {
      res.status(400).json({
        success: false,
        message: "Two-factor authentication is already enabled",
      });

      return;
    }

    user.twoFactorEnabled = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const disableTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validationResult = toggleTwoFactorValidationSchema.safeParse(
      req.body,
    );

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message,
      });

      return;
    }

    const { password } = validationResult.data;

    const authUser = req.user;

    if (!authUser) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const user = await User.findById(authUser._id).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid password",
      });

      return;
    }

    if (!user.twoFactorEnabled) {
      res.status(400).json({
        success: false,
        message: "Two-factor authentication is already disabled",
      });

      return;
    }

    user.twoFactorEnabled = false;

    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    user.twoFactorAttempts = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendTwoFactorCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const twoFactorToken = req.cookies.twoFactorToken;

    if (!twoFactorToken) {
      res.status(401).json({
        success: false,
        message: "2FA session expired",
      });

      return;
    }

    let decoded;

    try {
      decoded = verifyTwoFactorToken(twoFactorToken);
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired 2FA session",
      });

      return;
    }

    const user = await User.findById(decoded.userId).select(
      "+twoFactorCode +twoFactorCodeExpires",
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    if (!user.twoFactorEnabled) {
      res.status(400).json({
        success: false,
        message: "Two-factor authentication is disabled",
      });

      return;
    }

    const otp = generateOTP();

    const hashedOTP = await hashPassword(otp);

    await sendEmail({
      to: user.email,
      subject: "Your Login Verification Code",
      html: `
        <h2>Login Verification</h2>

        <p>Your new verification code is:</p>

        <h1>${otp}</h1>

        <p>This code will expire in 5 minutes.</p>

        <p>If you did not attempt to log in, please ignore this email.</p>
      `,
    });

    user.twoFactorCode = hashedOTP;

    user.twoFactorCodeExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.twoFactorAttempts = 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validationResult = changePasswordValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        errors: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });

      return;
    }

    const { currentPassword, newPassword } = validationResult.data;
    const authUser = req.user;

    if (!authUser) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });

      return;
    }

    const user = await User.findById(authUser._id).select(
      "+password +refreshToken",
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });

      return;
    }

    const isSamePassword = await comparePassword(newPassword, user.password);

    if (isSamePassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });

      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.lastPasswordChangedAt = new Date();

    // Force logout from all devices
    user.refreshToken = undefined;
    await user.save();
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
