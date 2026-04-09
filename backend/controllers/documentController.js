const Document = require("../models/Document");
const Case = require("../models/Case");
const fs = require("fs");
const Notification = require("../models/Notification"); // added by cipherNomad

const canAccessDocumentCase = (caseData, reqUser) => { // added by cipherNomad
  if (!caseData || !reqUser) return false; // added by cipherNomad
  const userId = reqUser.id; // added by cipherNomad
  const isAdvocate = caseData.advocateId?.toString?.() === userId; // added by cipherNomad
  const isOwner = caseData.user?.toString?.() === userId || caseData.userId?.toString?.() === userId; // added by cipherNomad
  const isClient = caseData.clientId?.toString?.() === userId; // added by cipherNomad
  const inClients = (caseData.clients || []).some((c) => c.user?.toString?.() === userId); // added by cipherNomad
  return isAdvocate || isOwner || isClient || inClients; // added by cipherNomad
}; // added by cipherNomad

// ======================
// UPLOAD DOCUMENT (DEBUG)
// ======================
exports.uploadDocument = async (req, res) => {
  try {
    console.log("========== UPLOAD START ==========");
    console.log("PARAM ID:", req.params.id);
    console.log("USER:", req.user?.id);
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const caseId = req.params.id;

    // Check file
    if (!req.file) {
      console.error("No file received by multer");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File received:", {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Fetch case
    const caseData = await Case.findById(caseId);
    console.log("CASE DATA:", caseData ? "FOUND" : "NOT FOUND");

    if (!caseData) {
      console.error("Case not found");
      return res.status(404).json({ message: "Case not found" });
    }

    // Auth check
    if (!canAccessDocumentCase(caseData, req.user)) { // added by cipherNomad
      console.error("Access denied"); // added by cipherNomad
      return res.status(403).json({ message: "Access denied" }); // added by cipherNomad
    } // added by cipherNomad

    console.log("Authorization passed");

    // Create document
    const doc = await Document.create({
      case: caseId,
      fileName: req.file.filename,
      filePath: req.file.path,
      uploadedBy: req.user.id, // added by cipherNomad
      uploaderRole: req.user.role // added by cipherNomad
    });

    console.log("Document saved:", doc._id);

    // Update case
    await Case.findByIdAndUpdate(caseId, {
      $push: { documents: doc._id }
    });

    const recipientId = req.user.role === "advocate" // added by cipherNomad
      ? (caseData.userId || caseData.clientId || caseData.clients?.[0]?.user) // added by cipherNomad
      : caseData.advocateId; // added by cipherNomad
    if (recipientId) { // added by cipherNomad
      const recipientType = req.user.role === "advocate" ? "client" : "advocate"; // added by cipherNomad
      await Notification.create({ // added by cipherNomad
        recipientId, // added by cipherNomad
        recipientType, // added by cipherNomad
        type: "document_uploaded", // added by cipherNomad
        message: `${req.user.role === "advocate" ? "Advocate" : "Client"} uploaded ${req.file.filename}`, // added by cipherNomad
        relatedId: doc._id // added by cipherNomad
      }); // added by cipherNomad
    } // added by cipherNomad

    console.log("Case updated with document");
    console.log("========== UPLOAD SUCCESS ==========");

    res.status(201).json(doc);

  } catch (error) {
    console.error("UPLOAD ERROR FULL:", error);
    console.error("STACK:", error.stack);

    res.status(500).json({
      message: error.message,
      debug: "Check backend logs"
    });
  }
};


// ======================
// DELETE DOCUMENT (DEBUG)
// ======================
exports.deleteDocument = async (req, res) => {
  try {
    console.log("========== DELETE START ==========");
    console.log("DOC ID:", req.params.id);
    console.log("USER:", req.user?.id);

    const doc = await Document.findById(req.params.id);

    if (!doc) {
      console.error("Document not found");
      return res.status(404).json({ message: "Not found" });
    }

    console.log("Document found");

    if (doc.uploadedBy.toString() !== req.user.id) {
      console.error("Unauthorized delete attempt");
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("Authorization passed");

    // Delete file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
      console.log("File deleted from disk");
    } else {
      console.warn("File not found on disk:", doc.filePath);
    }

    // Remove from case
    await Case.findByIdAndUpdate(doc.case, {
      $pull: { documents: doc._id }
    });

    console.log("Removed from case");

    // Delete document
    await doc.deleteOne();

    console.log("========== DELETE SUCCESS ==========");

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR FULL:", error);
    console.error("STACK:", error.stack);

    res.status(500).json({
      message: error.message,
      debug: "Check backend logs"
    });
  }
};
