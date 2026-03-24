const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { uploadAnyFile } = require("../middleware/uploadMiddleware");
const { transcribeAudio } = require("../controllers/transcribeController");

router.post("/", protect, uploadAnyFile.single("audio"), transcribeAudio);

module.exports = router;
