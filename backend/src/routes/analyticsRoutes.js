import express from "express";
import { getUrlAnalytics, getPublicAnalytics } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/public/:shortCode", getPublicAnalytics);
router.get("/:id", requireAuth, getUrlAnalytics);

export default router;
