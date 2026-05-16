import { Router } from "express";

const router = Router();

router.get("/sentiment/health", (_req, res) => {
  res.json({ status: "ok", module: "social-sentiment" });
});

export default router;
