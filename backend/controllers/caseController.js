const mongoose = require("mongoose");
const Case = require("../models/Case");
const User = require("../models/User");
const Notification = require("../models/Notification"); // added by cipherNomad

const serializeCaseForUser = (caseData, role, userId = null) => {
  if (!caseData) return caseData;
  const plainCase = typeof caseData.toObject === "function" ? caseData.toObject() : caseData;
  return {
    ...plainCase,
    currentUserRole: role,
    currentUserId: userId
  };
};

const getUserName = async (userId) => {
  if (!userId) return "";
  const user = await User.findById(userId).select("name");
  return user?.name || "";
};

const normalizeObjectId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toString === "function") return value.toString();
  return "";
};

const getCaseAdvocateId = (caseData) => normalizeObjectId(caseData?.advocateId || caseData?.user);
const getCaseUserId = (caseData) => normalizeObjectId(caseData?.userId) || normalizeObjectId(caseData?.clientId); // added by cipherNomad

const isAssignedAdvocate = (caseData, reqUser) => (
  Boolean(caseData && reqUser && reqUser.role === "advocate") &&
  getCaseAdvocateId(caseData) === reqUser.id
);

const isAssignedUser = (caseData, reqUser, currentUser = null) => {
  if (!caseData || !reqUser || reqUser.role !== "user") return false;

  const caseUserId = getCaseUserId(caseData);
  if (caseUserId && caseUserId === reqUser.id) {
    return true;
  }

  const normalizedEmail = currentUser?.email?.toLowerCase?.() || "";
  const normalizedName = currentUser?.name?.toLowerCase?.() || "";
  return (caseData.clients || []).some((client) => {
    const linkedUserId = normalizeObjectId(client.user);
    const linkedEmail = client.email?.toLowerCase?.() || "";
    const linkedName = client.name?.toLowerCase?.() || "";
    return (
      linkedUserId === reqUser.id ||
      (normalizedEmail && linkedEmail === normalizedEmail) ||
      (normalizedName && linkedName === normalizedName)
    );
  });
};

const canAccessCase = (caseData, reqUser, currentUser = null) => {
  if (!caseData || !reqUser) return false;
  if (reqUser.role === "advocate") {
    return isAssignedAdvocate(caseData, reqUser);
  }
  return isAssignedUser(caseData, reqUser, currentUser);
};

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

    const baseCasePayload = {
      title,
      caseNumber,
      description,
      status: validStatuses.includes(status) ? status : "processing",
      priority: validPriorities.includes(priority) ? priority : formattedPriority,
      tasks: [{ text: "Upload required documents", status: "pending" }]
    };

    if (req.user.role === "advocate") {
      baseCasePayload.user = req.user.id;
      baseCasePayload.advocateId = req.user.id;
      if (req.body.clientId) { // added by cipherNomad
        baseCasePayload.clientId = req.body.clientId; // added by cipherNomad
        baseCasePayload.userId = req.body.clientId; // added by cipherNomad
        baseCasePayload.clients = baseCasePayload.clients || []; // added by cipherNomad
        baseCasePayload.clients.push({ // added by cipherNomad
          user: req.body.clientId, // added by cipherNomad
          assignedAt: new Date() // added by cipherNomad
        }); // added by cipherNomad
      } // added by cipherNomad
    } else {
      baseCasePayload.user = req.user.id;
      baseCasePayload.userId = req.user.id;
    }

    const newCase = await Case.create(baseCasePayload);

    if (baseCasePayload.userId && req.user.role === "advocate") { // added by cipherNomad
      await Notification.create({ // added by cipherNomad
        recipientId: baseCasePayload.userId, // added by cipherNomad
        recipientType: "client", // added by cipherNomad
        type: "case_created", // added by cipherNomad
        message: `New case created: ${title}`, // added by cipherNomad
        relatedId: newCase._id // added by cipherNomad
      }); // added by cipherNomad
    } // added by cipherNomad

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

    let query;

    if (req.user.role === "advocate") {
      query = {
        $or: [
          { advocateId: req.user.id },
          { advocateId: { $exists: false }, user: req.user.id }
        ]
      };
    } else {
      query = {
        $or: [
          { userId: req.user.id },
          { clientId: req.user.id }, // added by cipherNomad
          { userId: { $exists: false }, "clients.user": req.user.id }
        ]
      };
    }

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

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
      console.error("Access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("CASE FETCHED:", caseData._id);

    res.json(serializeCaseForUser(caseData, req.user.role, req.user.id));

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

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("documents");

    console.log("CASE UPDATED");

    res.json(serializeCaseForUser(updated, req.user.role, req.user.id));

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

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
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
    const caseId = req.params.id || req.params.caseId;
    const uploadKind =
      req.query.kind === "evidence" || req.body?.kind === "evidence"
        ? "evidence"
        : "document";

    console.log("UPLOAD HIT");
    console.log("FILE:", req.file);
    console.log("FILES:", req.files);
    console.log("PARAM ID:", caseId);
    console.log("UPLOAD KIND:", uploadKind);

    const incomingFiles = Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : req.file
      ? [req.file]
      : [];

    if (incomingFiles.length === 0) {
      console.error("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      console.error("Case not found");
      return res.status(404).json({ message: "Case not found" });
    }

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
      console.error("Access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    const targetCollection = uploadKind === "evidence" ? "evidence" : "documents";
    caseData[targetCollection] = caseData[targetCollection] || [];
    const uploaderName = await getUserName(req.user.id);

    const existingNames = new Set(
      (caseData[targetCollection] || []).map((item) => (item.name || item.fileName || item.filename || "").toLowerCase())
    );

    incomingFiles.forEach((file) => {
      const normalizedName = (file.originalname || "").toLowerCase();
      if (existingNames.has(normalizedName)) {
        return;
      }

      caseData[targetCollection].push({
        name: file.originalname,
        filename: file.originalname,
        fileName: file.originalname,
        path: file.path,
        fileUrl: `/uploads/${file.filename}`,
        uploadedBy: req.user.id,
        uploadedByName: uploaderName,
        priority: req.body?.priority || "low"
      });
      existingNames.add(normalizedName);
    });

    caseData.timeline = caseData.timeline || [];

    if (uploadKind === "evidence") {
      incomingFiles.forEach((file) => {
        caseData.timeline.push({
          type: "proof_added",
          message: `Proof added: ${file.originalname}`
        });
      });
      caseData.status = "processing";
    } else {
      incomingFiles.forEach((file) => {
        caseData.timeline.push({
          type: "document_uploaded",
          message: `Uploaded: ${file.originalname}`
        });
      });
    }

    await caseData.save();

    const uploadedNames = incomingFiles
      .map((file) => file?.originalname)
      .filter(Boolean)
      .join(", ");
    const documentMessage = `${req.user.role === "advocate" ? "Advocate" : "Client"} uploaded ${uploadedNames || "new file(s)"}`;

    if (req.user.role === "advocate") {
      const targetClientId = caseData.userId || caseData.clientId || caseData.clients?.[0]?.user;
      if (targetClientId) {
        await Notification.create({
          recipientId: targetClientId,
          recipientType: "client",
          type: "document_uploaded",
          message: documentMessage,
          relatedId: caseData._id
        });
      }
    } else if (caseData.advocateId) {
      await Notification.create({
        recipientId: caseData.advocateId,
        recipientType: "advocate",
        type: "document_uploaded",
        message: documentMessage,
        relatedId: caseData._id
      });
    }

    console.log("DOCUMENT SAVED TO CASE");

    const updatedCase = await Case.findById(caseId);
    res.json(serializeCaseForUser(updatedCase, req.user.role, req.user.id));

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCaseDocuments = async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const documents = [...(caseData.documents || [])].sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const byPriority = (priorityOrder[a.priority || "low"] - priorityOrder[b.priority || "low"]);
      if (byPriority !== 0) return byPriority;
      return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
    });

    res.json(documents);
  } catch (error) {
    console.error("GET CASE DOCUMENTS ERROR:", error);
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

    res.json(serializeCaseForUser(caseData, req.user.role, req.user.id));

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

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (req.user?.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can pass judgement" });
    }

    let assignedAdvocateId = normalizeObjectId(caseData.advocateId);

    // Legacy fallback: older advocate-owned cases may not have advocateId persisted yet.
    if (!assignedAdvocateId && canAccessCase(caseData, req.user)) {
      assignedAdvocateId = req.user.id;
      caseData.advocateId = req.user.id;
    }

    if (!assignedAdvocateId || assignedAdvocateId !== req.user.id) {
      return res.status(403).json({ message: "Only the assigned advocate can update judgement" });
    }

    if (!judgement || !judgement.trim()) {
      return res.status(400).json({ message: "Judgement text is required" });
    }

    const advocate = await User.findById(req.user.id).select("name");
    const cleanJudgement = judgement.trim();
    const hearingTimestamp = new Date();
    const nextHearingNumber = (caseData.hearings?.length || 0) + 1;

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          advocateId: req.user.id,
          judgement: cleanJudgement,
          judgementAt: hearingTimestamp,
          judgementBy: req.user.id,
          judgementByName: advocate?.name || "",
          status: "ready"
        },
        $push: {
          timeline: {
            type: "judgement_added",
            message: `Hearing ${nextHearingNumber}: ${cleanJudgement}`,
            createdAt: hearingTimestamp
          },
          hearings: {
            number: nextHearingNumber,
            notes: cleanJudgement,
            createdAt: hearingTimestamp,
            createdBy: req.user.id,
            createdByName: advocate?.name || ""
          }
        }
      },
      {
        new: true
      }
    );

    res.json(serializeCaseForUser(updatedCase, req.user.role, req.user.id));

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

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (req.user?.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can close cases" });
    }

    const currentUser = req.user.role === "advocate"
      ? null
      : await User.findById(req.user.id).select("name email");

    if (!canAccessCase(caseData, req.user, currentUser)) {
      return res.status(403).json({ message: "Access denied" });
    }

    caseData.status = "closed";
    caseData.timeline = caseData.timeline || [];

    caseData.timeline.push({
      type: "case_closed",
      message: "Case closed"
    });

    await caseData.save();

    res.json(serializeCaseForUser(caseData, req.user.role, req.user.id));

  } catch (error) {
    console.error("CLOSE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.assignClientToCase = async (req, res) => {
  try {
    const { clientIdentifier, clientId, clientCode } = req.body; // added by cipherNomad
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (req.user?.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can assign clients" });
    }

    if (!isAssignedAdvocate(caseData, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!clientIdentifier && !clientId && !clientCode) { // added by cipherNomad
      return res.status(400).json({ message: "Client identifier is required" }); // added by cipherNomad
    }

    const identifier = (clientIdentifier || "").trim(); // added by cipherNomad
    const loweredIdentifier = identifier.toLowerCase(); // added by cipherNomad
    const normalizedClientCode = (clientCode || "").trim().toUpperCase(); // added by cipherNomad

    let clientUser = null; // added by cipherNomad

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) { // added by cipherNomad
      clientUser = await User.findOne({ _id: clientId, role: "user" }).select("name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!clientUser && normalizedClientCode) { // added by cipherNomad
      clientUser = await User.findOne({ role: "user", clientCode: normalizedClientCode }).select("name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!clientUser && loweredIdentifier) { // added by cipherNomad
      clientUser = await User.findOne({ // added by cipherNomad
        role: "user", // added by cipherNomad
        email: loweredIdentifier // added by cipherNomad
      }).select("name email clientCode"); // added by cipherNomad
    } // added by cipherNomad

    if (!clientUser && identifier) { // added by cipherNomad
      clientUser = await User.findOne({
        role: "user",
        name: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      }).select("name email clientCode");
    }

    if (!clientUser && identifier) { // added by cipherNomad
      clientUser = await User.findOne({
        role: "user",
        name: new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      }).select("name email clientCode"); // added by cipherNomad
    }

    caseData.clients = caseData.clients || [];
    const normalizedIdentifier = loweredIdentifier;
    const alreadyAssigned = caseData.clients.some((client) => {
      const linkedUserId = client.user?.toString();
      const linkedEmail = client.email?.toLowerCase?.() || "";
      const linkedName = client.name?.toLowerCase?.() || "";

      if (clientUser) {
        return (
          linkedUserId === clientUser._id.toString() ||
          linkedEmail === (clientUser.email || "").toLowerCase()
        );
      }

      return linkedEmail === normalizedIdentifier || linkedName === normalizedIdentifier;
    });

    if (alreadyAssigned) {
      return res.status(400).json({ message: "Client is already linked to this case" });
    }

    caseData.clients.push({
      user: clientUser?._id,
      name: clientUser?.name || identifier,
      email: clientUser?.email || loweredIdentifier,
      assignedAt: new Date()
    });

    if (clientUser?._id) { // added by cipherNomad
      caseData.clientId = caseData.clientId || clientUser._id; // added by cipherNomad
    } // added by cipherNomad

    caseData.timeline = caseData.timeline || [];
    caseData.timeline.push({
      type: "client_assigned",
      message: `Client assigned: ${clientUser?.name || identifier}`
    });

    caseData.advocateId = caseData.advocateId || req.user.id;
    if (clientUser?._id) {
      caseData.userId = clientUser._id;
    }

    await caseData.save();

    if (clientUser?._id) { // added by cipherNomad
      const advocate = await User.findById(req.user.id).select("name"); // added by cipherNomad
      await Notification.create({ // added by cipherNomad
        recipientId: clientUser._id, // added by cipherNomad
        recipientType: "client", // added by cipherNomad
        type: "client_added", // added by cipherNomad
        message: `${advocate?.name || "Advocate"} added you as client in case ${caseData.title}`, // added by cipherNomad
        relatedId: caseData._id // added by cipherNomad
      }); // added by cipherNomad
    } // added by cipherNomad

    res.json(serializeCaseForUser(caseData, req.user.role, req.user.id));
  } catch (error) {
    console.error("ASSIGN CLIENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.uploadEvidence = async (req, res) => {
  try {
    const caseId = req.params.id || req.params.caseId;

    console.log("EVIDENCE UPLOAD HIT");
    console.log("FILE:", req.file);
    console.log("PARAM ID:", caseId);

    if (!req.file) {
      console.error("No evidence file uploaded");
      return res.status(400).json({ message: "No evidence file uploaded" });
    }

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      console.error("Case not found");
      return res.status(404).json({ message: "Case not found" });
    }

    if (!canAccessCase(caseData, req.user)) {
      console.error("Access denied");
      return res.status(403).json({ message: "Access denied" });
    }

    caseData.evidence = caseData.evidence || [];

    caseData.evidence.push({
      filename: req.file.originalname,
      path: req.file.path
    });

    caseData.timeline = caseData.timeline || [];

    caseData.timeline.push({
      type: "proof_added",
      message: `Proof added: ${req.file.originalname}`
    });

    caseData.status = "processing";

    await caseData.save();

    console.log("EVIDENCE SAVED TO CASE");

    const updatedCase = await Case.findById(caseId);
    res.json(serializeCaseForUser(updatedCase, req.user.role, req.user.id));

  } catch (error) {
    console.error("EVIDENCE UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCaseFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { source, fileName } = req.body;

    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (!isAssignedAdvocate(caseData, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!["documents", "evidence"].includes(source)) {
      return res.status(400).json({ message: "Invalid file source" });
    }

    const files = caseData[source] || [];
    const fileIndex = files.findIndex((file) => (file.fileName || file.filename) === fileName);

    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" });
    }

    const [removedFile] = files.splice(fileIndex, 1);
    const normalizedFile = {
      filename: removedFile.filename || removedFile.fileName || fileName,
      fileName: removedFile.fileName || removedFile.filename || fileName,
      path: removedFile.path || "",
      fileUrl: removedFile.fileUrl || "",
      source,
      deletedAt: new Date()
    };

    caseData[source] = files;
    caseData.recycleBin = caseData.recycleBin || [];
    caseData.recycleBin.push(normalizedFile);

    caseData.timeline = caseData.timeline || [];
    caseData.timeline.push({
      type: "file_deleted",
      message: `${source === "documents" ? "Document" : "Evidence"} deleted: ${fileName}`
    });

    await caseData.save();

    const updatedCase = await Case.findById(id);
    res.json(serializeCaseForUser(updatedCase, req.user.role, req.user.id));
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.restoreCaseFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, source } = req.body;

    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (!isAssignedAdvocate(caseData, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const recycleFiles = caseData.recycleBin || [];
    const fileIndex = recycleFiles.findIndex(
      (file) => (file.fileName || file.filename) === fileName && file.source === source
    );

    if (fileIndex === -1) {
      return res.status(404).json({ message: "Recycle bin file not found" });
    }

    const [restoredFile] = recycleFiles.splice(fileIndex, 1);
    caseData.recycleBin = recycleFiles;
    caseData[source] = caseData[source] || [];
    caseData[source].push({
      filename: restoredFile.filename || restoredFile.fileName || fileName,
      fileName: restoredFile.fileName || restoredFile.filename || fileName,
      path: restoredFile.path,
      fileUrl: restoredFile.fileUrl,
      uploadedAt: new Date()
    });

    caseData.timeline = caseData.timeline || [];
    caseData.timeline.push({
      type: "file_restored",
      message: `${source === "documents" ? "Document" : "Evidence"} restored: ${fileName}`
    });

    await caseData.save();

    const updatedCase = await Case.findById(id);
    res.json(serializeCaseForUser(updatedCase, req.user.role, req.user.id));
  } catch (error) {
    console.error("RESTORE FILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
