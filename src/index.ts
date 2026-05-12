import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./db/connect.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

await connectDB();
const port = process.env.PORT || 8000;

const server = async () => {
  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

server();
