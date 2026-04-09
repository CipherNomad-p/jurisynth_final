const Notification = require("../models/Notification"); // added by cipherNomad
const User = require("../models/User");
const Case = require("../models/Case");

exports.getNotifications = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const items = await Notification.find({ recipientId: req.user.id }) // added by cipherNomad
      .sort({ createdAt: -1 }); // added by cipherNomad
    res.json(items); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

exports.markNotificationRead = async (req, res) => { // added by cipherNomad
  try { // added by cipherNomad
    const item = await Notification.findById(req.params.id); // added by cipherNomad
    if (!item || item.recipientId.toString() !== req.user.id) { // added by cipherNomad
      return res.status(404).json({ message: "Notification not found" }); // added by cipherNomad
    } // added by cipherNomad
    item.isRead = true; // added by cipherNomad
    await item.save(); // added by cipherNomad
    res.json(item); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    res.status(500).json({ message: error.message }); // added by cipherNomad
  } // added by cipherNomad
}; // added by cipherNomad

const notificationTypeTemplates = {
  document_requested: "Please upload the requested document(s) for your case.",
  hearing_update: "Your hearing details have been updated. Please check the case timeline.",
  case_update: "There is a new update in your case. Please review it in the dashboard.",
  payment_reminder: "This is a reminder for pending case-related payment.",
  generic: "You have a new update from your advocate."
};

exports.sendClientNotification = async (req, res) => {
  try {
    if (req.user.role !== "advocate") {
      return res.status(403).json({ message: "Only advocates can send client notifications" });
    }

    const { recipientId, type, message, relatedId } = req.body || {};

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId is required" });
    }

    const normalizedType = (type || "generic").toLowerCase();
    if (!notificationTypeTemplates[normalizedType]) {
      return res.status(400).json({ message: "Unsupported notification type" });
    }

    const client = await User.findOne({
      _id: recipientId,
      role: "user",
      createdBy: req.user.id
    }).select("_id name");

    if (!client) {
      return res.status(404).json({ message: "Client not found in your account" });
    }

    if (relatedId) {
      const linkedCase = await Case.findOne({ _id: relatedId, advocateId: req.user.id }).select("_id");
      if (!linkedCase) {
        return res.status(403).json({ message: "Invalid related case for this advocate" });
      }
    }

    const finalMessage = (message || "").trim() || notificationTypeTemplates[normalizedType];

    const created = await Notification.create({
      recipientId: client._id,
      recipientType: "client",
      type: normalizedType,
      message: finalMessage,
      ...(relatedId ? { relatedId } : {})
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
