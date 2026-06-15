import express from "express";
import { 
  createShortUrl, 
  deleteUrl, 
  getUserUrls, 
  updateUrl,
  getAdminUrls,
  adminUpdateUrl,
  adminDeleteUrl,
  getDbInspectorData
} from "../controllers/urlController.js";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

// Admin controls MUST be before /:id routes to prevent shadowing
router.get("/admin/all", requireAdmin, getAdminUrls);
router.patch("/admin/:id", requireAdmin, adminUpdateUrl);
router.delete("/admin/:id", requireAdmin, adminDeleteUrl);
router.get("/admin/db", requireAdmin, getDbInspectorData);

// User-level URL routes
router.get("/myurls", getUserUrls);
router.post("/create", createShortUrl);
router.patch("/:id", updateUrl);
router.delete("/:id", deleteUrl);

export default router;
