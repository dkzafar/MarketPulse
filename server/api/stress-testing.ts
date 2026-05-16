import { Router } from "express";

const router = Router();

router.get("/stress-test/health", (_req, res) => {
  res.json({ status: "ok", module: "stress-testing" });
});

export default router;
