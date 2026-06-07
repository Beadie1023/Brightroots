import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/auth/pin", (req, res) => {
  const PARENT_PIN = process.env.PARENT_PIN;
  if (!PARENT_PIN) {
    res.status(503).json({ error: "PARENT_PIN is not configured on the server" });
    return;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(503).json({ error: "SESSION_SECRET is not configured" });
    return;
  }
  const { pin } = req.body as { pin?: unknown };
  if (!pin || String(pin) !== PARENT_PIN) {
    res.status(401).json({ error: "Incorrect PIN" });
    return;
  }
  const token = jwt.sign({ role: "parent" }, secret, { expiresIn: "30d" });
  res.json({ token });
});

export default router;
