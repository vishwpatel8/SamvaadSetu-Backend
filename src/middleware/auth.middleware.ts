import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";
import { type AuthenticatedRequest } from "../types/request.type.js";
import { type JwtPayload } from "../types/user.types.js";

const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
    
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });

    return;
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string,
  ) as JwtPayload;

  const user = await UserModel.findById(decoded.id).select("-password");

  if (!user) {
    res.status(401).json({
      success: false,
      message: "User not found",
    });

    return;
  }

  const authRequest = req as AuthenticatedRequest;

  authRequest.user = user;
  authRequest.userId = decoded.id;

  next();
};

export default protect;
