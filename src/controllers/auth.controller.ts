import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";

import {
  type LoginRequestBody,
  type SignupRequestBody,
} from "../types/request.type.js";

import { type JwtPayload } from "../types/user.types.js";

export const signup = async (
  req: Request<object, object, SignupRequestBody>,
  res: Response,
): Promise<void> => {
  const { firstName, lastName, email, password, gender, age } = req.body;

  if (!firstName || !lastName || !email || !password || !gender || !age) {
    res.status(400).json({
      success: false,
      message: "All fields are required",
    });

    return;
  }

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    res.status(409).json({
      success: false,
      message: "User already exists",
    });

    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    gender,
    age,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",

    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      age: user.age,
    },
  });
};

export const login = async (
  req: Request<object, object, LoginRequestBody>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });

    return;
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });

    return;
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });

    return;
  }

  const payload: JwtPayload = {
    id: user._id.toString(),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",

    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      age: user.age,
    },
  });
};

export const logout = async (_: Request, res: Response): Promise<void> => {
  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
