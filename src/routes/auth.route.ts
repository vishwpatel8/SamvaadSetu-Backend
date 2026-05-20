import { registerUser } from "@src/controllers/auth.controller";
import { Router } from "express";

import authLimiter from "@src/middleware/rateLimiter.middleware";

const authRouter = Router();

authRouter.post("/register", authLimiter, registerUser);

export default authRouter;
