const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// ✅ CONTROLLER (included here for clarity)
const uploadDocument = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.status(200).json({
      message: "File uploaded successfully",
      file: req.files[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    res.status(200).json({ message: "Document deleted (dummy)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED ROUTE (IMPORTANT CHANGE HERE)
router.post("/:id", protect, upload.any(), uploadDocument);

router.delete("/:id", protect, deleteDocument);

module.exports = router;