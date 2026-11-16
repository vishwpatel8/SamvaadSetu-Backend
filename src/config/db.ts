import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const client = postgres(databaseUrl, { max: 10 });
export const db = drizzle(client);

export const connectDatabase = async () => {
  await client`SELECT 1`;
  console.log("PostgreSQL connected successfully!");
};
