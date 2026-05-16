import { Router } from "express";

const router = Router();

router.get("/demo/health", (_req, res) => {
  res.json({ status: "ok", module: "demo-enhanced" });
});

export default router;
