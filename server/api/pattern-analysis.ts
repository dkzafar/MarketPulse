import { Router } from "express";

const router = Router();

router.get("/patterns/health", (_req, res) => {
  res.json({ status: "ok", module: "pattern-analysis" });
});

export default router;
