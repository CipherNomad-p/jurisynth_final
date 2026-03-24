const Case = require("../models/Case");
const User = require("../models/User");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.globalSearch = async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.json({ cases: [], documents: [], users: [] });
    }

    const regex = new RegExp(escapeRegex(query), "i");

    const caseAccessQuery = req.user.role === "advocate"
      ? { $or: [{ advocateId: req.user.id }, { advocateId: { $exists: false }, user: req.user.id }] }
      : { $or: [{ userId: req.user.id }, { userId: { $exists: false }, "clients.user": req.user.id }] };

    const accessibleCases = await Case.find(caseAccessQuery)
      .select("title caseNumber description status documents updatedAt")
      .sort({ updatedAt: -1 })
      .limit(100);

    const cases = accessibleCases.filter((caseItem) => {
      const documentNames = (caseItem.documents || []).flatMap((doc) => [
        doc?.name,
        doc?.fileName,
        doc?.filename
      ]);

      const searchableValues = [
        caseItem.title,
        caseItem.caseNumber,
        caseItem.description,
        caseItem.status,
        ...documentNames
      ].filter(Boolean);

      return searchableValues.some((value) => regex.test(String(value)));
    }).slice(0, 20);

    const caseResults = cases.map((caseItem) => ({
      _id: caseItem._id,
      title: caseItem.title,
      caseNumber: caseItem.caseNumber,
      description: caseItem.description,
      status: caseItem.status
    }));

    const documentResults = cases.flatMap((caseItem) =>
      (caseItem.documents || [])
        .filter((doc) => regex.test(doc.name || doc.fileName || doc.filename || ""))
        .map((doc, index) => ({
          id: `${caseItem._id}-${index}`,
          caseId: caseItem._id,
          caseTitle: caseItem.title,
          caseNumber: caseItem.caseNumber,
          name: doc.name || doc.fileName || doc.filename || "Document",
          fileUrl: doc.fileUrl || doc.path || "",
          uploadedAt: doc.uploadedAt,
          priority: doc.priority || "low"
        }))
    ).slice(0, 20);

    let users = [];
    if (req.user.role === "advocate") {
      users = await User.find({
        $or: [{ name: regex }, { email: regex }]
      })
        .select("name email role")
        .limit(10);
    }

    res.json({
      cases: caseResults,
      documents: documentResults,
      users
    });
  } catch (error) {
    console.error("GLOBAL SEARCH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
