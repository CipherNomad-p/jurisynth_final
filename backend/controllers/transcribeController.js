exports.transcribeAudio = async (req, res) => {
  try {
    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);

    if (!uploadedFile) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    res.json({
      text: `Placeholder transcription for ${uploadedFile.originalname}. This is a starter flow and can be connected to a transcription model later.`
    });
  } catch (error) {
    console.error("TRANSCRIBE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
