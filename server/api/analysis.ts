import { Router } from "express";

const router = Router();

router.get("/analysis/health", (_req, res) => {
  res.json({ status: "ok", module: "analysis" });
});

export default router;
