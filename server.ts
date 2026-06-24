import express from "express";
import app from "./api/index.js";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

// Configure Vite middleware or production static files
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from dist/ folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server successfully running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Failed to start server:", err);
});
