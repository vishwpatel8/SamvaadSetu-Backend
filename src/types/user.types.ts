import { users } from "../db/schema.js";

export type User = typeof users.$inferSelect;
