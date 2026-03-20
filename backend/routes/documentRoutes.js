const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadDocument,
  deleteDocument
} = require("../controllers/documentController");

// Upload
router.post("/:caseId", protect, upload.single("document"), uploadDocument);

// Delete (Shrikant feature)
router.delete("/:id", protect, deleteDocument);

module.exports = router;