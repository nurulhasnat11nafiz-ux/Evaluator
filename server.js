import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // 2. Environment Setup
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), "dist");

  if (!isProd) {
    // DEVELOPMENT MODE: Use Vite middleware
    console.log("Running in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // PRODUCTION MODE: Serve static files from dist
    if (fs.existsSync(distPath)) {
      console.log("Running in PRODUCTION mode, serving from /dist...");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      // FALLBACK: If dist is missing in production
      console.error("❌ ERROR: /dist folder not found!");
      app.get("*", (req, res) => {
        res.status(500).send(`
          <h1>Build Missing</h1>
          <p>The <code>/dist</code> folder was not found. Please run <code>npm run build</code> first.</p>
        `);
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
