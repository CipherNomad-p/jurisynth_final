const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  uploadDocument,
  addProof,
  addJudgement,
  closeCase
} = require("../controllers/caseController");

// Create
router.post("/", protect, createCase);

// Read
router.get("/", protect, getCases);
router.get("/:id", protect, getCaseById);

// Update
router.put("/:id", protect, updateCase);

// Delete
router.delete("/:id", protect, deleteCase);

// Upload document (standardized)
router.post("/:id/documents", protect, upload.single("file"), uploadDocument);

// Extra features (Gargi)
router.post("/:id/proof", protect, addProof);
router.post("/:id/judgement", protect, addJudgement);
router.post("/:id/close", protect, closeCase);

module.exports = router;