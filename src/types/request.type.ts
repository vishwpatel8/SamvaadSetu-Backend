import { type Request } from "express";

import { type Gender, type IUser } from "./user.types.js";

export interface SignupRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  age: number;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface AuthenticatedRequest extends Request {
  user: IUser;
  userId: string;
}
