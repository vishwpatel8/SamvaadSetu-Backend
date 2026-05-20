import crypto from "crypto";
import type { Request, Response } from "express";

// User Model and Validation
import User from "@src/model/user.model";
import {
  loginUserValidationSchema,
  registerUserValidationSchema,
} from "@src/validation/user.validation";

// Utilities
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@src/utils/cookies";
import { generateAccessToken, generateRefreshToken } from "@src/utils/jwt";
import { comparePassword, hashPassword } from "@src/utils/password";

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
      res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        message: "Two-factor authentication required",
      });

      return;
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
