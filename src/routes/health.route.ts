import { sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../config/db.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
