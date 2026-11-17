import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";

interface TokenPayload {
    userId: string;
}

// Function to get secret from environment variables
const getSecret = (key: string): string => {
    const secret = process.env[key];
    if (!secret) { throw new Error(`${key} is missing`); }
    return secret;
};

// ================ Access Token ==================
export const generateAccessToken = (userId: string): string => {
    return jwt.sign({ userId }, getSecret("ACCESS_TOKEN_SECRET"), { expiresIn: "15m" });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, getSecret("ACCESS_TOKEN_SECRET")) as TokenPayload;
};

// ================ Refresh Token ==================
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ userId }, getSecret("REFRESH_TOKEN_SECRET"), { expiresIn: "7d" });
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, getSecret("REFRESH_TOKEN_SECRET")) as TokenPayload;
};

// ========= Two-Factor Authentication Token ===========
export const generateTwoFactorToken = (userId: string): string => {
    return jwt.sign({ userId }, getSecret("TWO_FACTOR_TOKEN_SECRET"), { expiresIn: "5m" },);
};

export const verifyTwoFactorToken = (token: string): TokenPayload => {
    return jwt.verify(token, getSecret("TWO_FACTOR_TOKEN_SECRET")) as TokenPayload;
};

// ================ Verification Token ==================
export const generateVerificationToken = () => {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    return { token, tokenHash };
};