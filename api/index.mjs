import app, { ensureDbConnection } from "../backend/src/index.js";

export default async function handler(req, res) {
  try {
    await ensureDbConnection();
    return app(req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server initialization failed" });
  }
}
