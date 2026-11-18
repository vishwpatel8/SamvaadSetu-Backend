import "dotenv/config";
import app from "./app.js";
import { closeDatabase, connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT ?? 4000);
const SHUTDOWN_TIMEOUT = 10_000;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to database before accepting requests
    await connectDatabase();

    // 2. Start HTTP server
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    // 3. Graceful shutdown
    let shuttingDown = false;
    const shutdown = (signal: string): void => {
      if (shuttingDown) return;
      shuttingDown = true;

      console.log(`${signal} received. Starting graceful shutdown...`);

      // Force shutdown if graceful shutdown takes too long
      const forceExitTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out.");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT);

      forceExitTimer.unref();

      // Stop accepting new connections and finish existing requests
      server.close(async (error) => {
        if (error) {
          console.error("HTTP server shutdown failed:", error);
          process.exitCode = 1;
        }

        try {
          await closeDatabase();
          console.log("Database connection closed.");
        } catch (error) {
          console.error("Database shutdown failed:", error);
          process.exitCode = 1;
        } finally {
          clearTimeout(forceExitTimer);
        }
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
