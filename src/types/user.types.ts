import { Document } from "mongoose";

export type Gender = "male" | "female" | "other";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  age: number;
}

export interface JwtPayload {
  id: string;
}