const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { upload, uploadAnyFile } = require("../middleware/uploadMiddleware");

const {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  uploadDocument,
  getCaseDocuments,
  uploadEvidence,
  deleteCaseFile,
  restoreCaseFile,
  addProof,
  addJudgement,
  assignClientToCase,
  closeCase
} = require("../controllers/caseController");

router.use(protect);

// Create
router.post("/", createCase);

// Read
router.get("/", getCases);
router.get("/:id", getCaseById);

// Update
router.put("/:id", updateCase);

// Delete
router.delete("/:id", deleteCase);

// Upload document (standardized)
router.post("/:id/documents", upload.array("files", 10), uploadDocument);
router.get("/:id/documents", getCaseDocuments);
router.post("/:id/evidence", uploadAnyFile.single("file"), uploadEvidence);

// Extra features (Gargi)
router.post("/:id/proof", addProof);
router.post("/:id/judgement", authorize("advocate"), addJudgement);
router.patch("/:id/judgement", authorize("advocate"), addJudgement);
router.post("/:id/clients", authorize("advocate"), assignClientToCase);
router.post("/:id/close", authorize("advocate"), closeCase);
router.post("/:id/files/delete", deleteCaseFile);
router.post("/:id/files/restore", restoreCaseFile);

module.exports = router;
