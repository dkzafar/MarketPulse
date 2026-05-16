import { Router } from "express";

const router = Router();

router.get("/enhanced/health", (_req, res) => {
  res.json({ status: "ok", module: "enhanced-routes" });
});

export default router;
