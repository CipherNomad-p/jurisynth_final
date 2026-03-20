const mongoose = require("mongoose");
const Case = require("../models/Case");
const User = require("../models/User");

// ======================
// CREATE CASE (DEBUG)
// ======================
exports.createCase = async (req, res) => {
  try {
    console.log("CREATE CASE BODY:", req.body);
    console.log("USER:", req.user?.id);

    const { title, caseNumber, description, status, priority } = req.body;

    const existing = await Case.findOne({ caseNumber });
    if (existing) {
      console.error("Duplicate case number");
      return res.status(400).json({ message: "Case number already exists" });
    }

    const validStatuses = ["processing", "ready", "closed"];
    const validPriorities = ["high", "medium", "low"];

    let formattedPriority = "medium";
    if (priority) {
      const p = priority.toLowerCase();
      if (p.includes("high")) formattedPriority = "high";
      else if (p.includes("medium")) formattedPriority = "medium";
      else formattedPriority = "low";
    }

    const newCase = await Case.create({
      title,
      caseNumber,
      description,
      status: validStatuses.includes(status) ? status : "processing",
      priority: validPriorities.includes(priority) ? priority : formattedPriority,
      user: req.user.id,
      tasks: [{ text: "Upload required documents", status: "pending" }]
    });

    console.log("CASE CREATED:", newCase._id);

    res.status(201).json(newCase);

  } catch (error) {
    console.error("CREATE ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate case number" });
    }
    res.status(500).json({ message: error.message });
  }
};


// ======================
// GET CASES (DEBUG)
// ======================
exports.getCases = async (req, res) => {
  try {
    console.log("GET CASES USER:", req.user?.id, "ROLE:", req.user?.role);

    const query = req.user.role === "advocate"
      ? { user: req.user.id }
      : {};

    let cases = await Case.find(query)
      .populate("documents")
      .sort({ createdAt: -1 });

    console.log("CASES FETCHED:", cases.length);

    const priorityOrder = { high: 1, medium: 2, low: 3 };
    cases = cases.sort((a, b) =>
      (priorityOrder[a.priority || "low"] - priorityOrder[b.priority || "low"])
    );

    res.json(cases);

  } catch (error) {
    console.error("GET CASES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// GET CASE BY ID (DEBUG)
// ======================
exports.getCaseById = async (req, res) => {
  try {
    console.log("GET CASE ID:", req.params.id);

    const caseData = await Case.findById(req.params.id).populate("documents");

    if (!caseData) {
      console.error("Case not found");
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseData.user.toString() !== req.user.id) {
      console.error("Access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("CASE FETCHED:", caseData._id);

    res.json(caseData);

  } catch (error) {
    console.error("GET CASE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// UPDATE CASE (DEBUG)
// ======================
exports.updateCase = async (req, res) => {
  try {
    console.log("UPDATE CASE ID:", req.params.id);
    console.log("UPDATE BODY:", req.body);

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseData.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("documents");

    console.log("CASE UPDATED");

    res.json(updated);

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// DELETE CASE (DEBUG)
// ======================
exports.deleteCase = async (req, res) => {
  try {
    console.log("DELETE CASE ID:", req.params.id);

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseData.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await caseData.deleteOne();

    console.log("CASE DELETED");

    res.json({ message: "Case deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// UPLOAD DOCUMENT (DEBUG)
// ======================
exports.uploadDocument = async (req, res) => {
  try {
    console.log("UPLOAD HIT");
    console.log("FILE:", req.file);
    console.log("PARAM ID:", req.params.id);

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      console.error("Case not found");
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseData.user.toString() !== req.user.id) {
      console.error("Access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    caseData.documents = caseData.documents || [];

    caseData.documents.push({
      filename: req.file.originalname,
      path: req.file.path
    });

    caseData.timeline = caseData.timeline || [];

    caseData.timeline.push({
      type: "document_uploaded",
      message: `Uploaded: ${req.file.originalname}`
    });

    await caseData.save();

    console.log("DOCUMENT SAVED TO CASE");

    res.json(caseData);

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// ADD PROOF (DEBUG)
// ======================
exports.addProof = async (req, res) => {
  try {
    console.log("ADD PROOF:", req.body);

    const { text } = req.body;
    const caseData = await Case.findById(req.params.id);

    caseData.timeline.push({
      type: "proof_added",
      message: text
    });

    caseData.status = "processing";

    await caseData.save();

    res.json(caseData);

  } catch (error) {
    console.error("ADD PROOF ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// ADD JUDGEMENT (DEBUG)
// ======================
exports.addJudgement = async (req, res) => {
  try {
    console.log("ADD JUDGEMENT:", req.body);

    const { judgement } = req.body;
    const caseData = await Case.findById(req.params.id);

    caseData.timeline.push({
      type: "judgement_added",
      message: judgement
    });

    caseData.status = "ready";

    await caseData.save();

    res.json(caseData);

  } catch (error) {
    console.error("JUDGEMENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================
// CLOSE CASE (DEBUG)
// ======================
exports.closeCase = async (req, res) => {
  try {
    console.log("CLOSE CASE:", req.params.id);

    const caseData = await Case.findById(req.params.id);

    caseData.status = "closed";

    caseData.timeline.push({
      type: "case_closed",
      message: "Case closed"
    });

    await caseData.save();

    res.json(caseData);

  } catch (error) {
    console.error("CLOSE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};