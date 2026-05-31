import jwt from "jsonwebtoken";

import type { IUser } from "@src/types/user.types";

interface IAccessTokenPayload {
  userId: string;
}

interface IRefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (user: IUser): string => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

  if (!accessTokenSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is missing");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    accessTokenSecret,
    {
      expiresIn: "15m",
    },
  );
};

export const generateRefreshToken = (user: IUser): string => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    refreshTokenSecret,
    {
      expiresIn: "7d",
    },
  );
};

export const verifyAccessToken = (token: string): IAccessTokenPayload => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

  if (!accessTokenSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is missing");
  }

  return jwt.verify(token, accessTokenSecret) as IAccessTokenPayload;
};

export const verifyRefreshToken = (token: string): IRefreshTokenPayload => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing");
  }

  return jwt.verify(token, refreshTokenSecret) as IRefreshTokenPayload;
};

export const generateTwoFactorToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "5m",
  });
};

export const verifyTwoFactorToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as {
    userId: string;
  };
};
