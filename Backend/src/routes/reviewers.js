import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listReviewersForUser,
  getReviewerById,
  deleteReviewer
} from "../services/storage.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const reviewers = await listReviewersForUser(req.user.id);
    return res.json({ reviewers });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const reviewer = await getReviewerById(req.params.id);
    if (!reviewer || reviewer.userId !== req.user.id) {
      return res.status(404).json({ message: "Reviewer not found." });
    }

    return res.json({ reviewer });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const removed = await deleteReviewer(req.params.id, req.user.id);
    if (!removed) {
      return res.status(404).json({ message: "Reviewer not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
