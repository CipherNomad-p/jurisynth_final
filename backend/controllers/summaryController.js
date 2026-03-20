const Case = require("../models/Case");
const User = require("../models/User");
const fs = require("fs");
let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (e) {
  console.error("pdf-parse import failed");
}
const mammoth = require("mammoth");
const buildLegalPrompt = require("../utils/promptBuilder");

const apiKey = process.env.GEMINI_API_KEY;

exports.generateSummary = async (req, res) => {
  try {
    const { caseId } = req.params;

    console.log("\n===== SUMMARY START =====");
    console.log("CASE ID:", caseId);
    console.log("USER ID:", req.user?.id);

    const [caseData, userData] = await Promise.all([
      Case.findById(caseId),
      User.findById(req.user.id)
    ]);

    console.log("CASE FOUND:", !!caseData);
    console.log("USER FOUND:", !!userData);

    if (!caseData || caseData.user.toString() !== req.user.id) {
      console.log("❌ Unauthorized or missing case");
      return res.status(404).json({ message: "Case not found or unauthorized" });
    }

    console.log("DOCUMENT COUNT:", caseData.documents?.length);

    if (!caseData.documents || caseData.documents.length === 0) {
      console.log("❌ No documents in case");
      return res.status(400).json({ message: "No documents found" });
    }

    let combinedText = "";

    for (const doc of caseData.documents) {
      console.log("\n--- Processing Document ---");
      console.log(doc);

      try {
        const filePath = doc.filePath || doc.path;
        const fileName = doc.fileName || doc.filename;

        console.log("PATH:", filePath);
        console.log("NAME:", fileName);

        if (!filePath || !fs.existsSync(filePath)) {
          console.log("❌ File missing on disk");
          continue;
        }

        const buffer = fs.readFileSync(filePath);

        if (fileName.toLowerCase().endsWith(".pdf")) {
          console.log("📄 Parsing PDF...");

          if (typeof pdfParse !== "function") {
            console.log("❌ pdfParse is not a function");
            continue;
          }

          const pdf = await pdfParse(buffer);
          console.log("PDF TEXT LENGTH:", pdf.text.length);

          combinedText += pdf.text + "\n\n";
        } 
        else if (fileName.toLowerCase().endsWith(".docx")) {
          console.log("📄 Parsing DOCX...");
          const docx = await mammoth.extractRawText({ path: filePath });
          combinedText += docx.value + "\n\n";
        } 
        else {
          console.log("📄 Parsing TEXT...");
          combinedText += buffer.toString() + "\n\n";
        }

      } catch (err) {
        console.error("❌ File read error:", err.message);
      }
    }

    console.log("\nCOMBINED TEXT LENGTH:", combinedText.length);

    if (!combinedText.trim()) {
      console.log("❌ No readable content extracted");
      return res.status(400).json({ message: "No readable content found in documents" });
    }

    const prompt = buildLegalPrompt(
      combinedText,
      userData?.aiSettings || {}
    );

    console.log("\nPROMPT LENGTH:", prompt.length);

    const model =
      userData?.aiSettings?.modelPreference === "Gemini 1.5 Pro"
        ? "gemini-2.5-pro"
        : "gemini-2.5-flash";

    console.log("MODEL:", model);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const result = await response.json();

    console.log("\nGEMINI RESPONSE:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.log("❌ Gemini request failed");
      return res.status(500).json({
        message: result.error?.message || "AI request failed"
      });
    }

    let raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("RAW OUTPUT:", raw);

    if (!raw) {
      console.log("❌ Empty AI response");
      return res.status(500).json({ message: "Empty AI response" });
    }

    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.log("❌ JSON PARSE FAILED");
      console.log("RAW:", raw);
      return res.status(500).json({ message: "Invalid JSON from AI" });
    }

    caseData.aiSummary = parsed.summary;
    caseData.keyPoints = parsed.keyPoints;
    caseData.status = "ready";

    if (!caseData.timeline) caseData.timeline = [];

    caseData.timeline.push({
      type: "ai_generated",
      message: "AI summary created"
    });

    await caseData.save();

    console.log("✅ SUMMARY SUCCESS");

    res.json(caseData);

  } catch (error) {
    console.error("🔥 FINAL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSummaryByCase = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.caseId);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json({
      summary: caseData.aiSummary,
      keyPoints: caseData.keyPoints,
      status: caseData.status
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};