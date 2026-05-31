import type { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;

  username: string;
  email: string;
  password: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpires?: Date;
  twoFactorAttempts: number;
  refreshToken?: string;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  lastPasswordChangedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
