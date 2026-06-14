import express from "express";
import { createShortUrl, deleteUrl, getUserUrls, updateUrl } from "../controllers/urlController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/myurls", getUserUrls);
router.post("/create", createShortUrl);
router.patch("/:id", updateUrl);
router.delete("/:id", deleteUrl);

export default router;
