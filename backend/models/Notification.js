const mongoose = require("mongoose"); // added by cipherNomad

const notificationSchema = new mongoose.Schema( // added by cipherNomad
  { // added by cipherNomad
    recipientId: { // added by cipherNomad
      type: mongoose.Schema.Types.ObjectId, // added by cipherNomad
      ref: "User", // added by cipherNomad
      required: true // added by cipherNomad
    }, // added by cipherNomad

    recipientType: { // added by cipherNomad
      type: String, // added by cipherNomad
      enum: ["advocate", "client", "user"], // added by cipherNomad
      required: true // added by cipherNomad
    }, // added by cipherNomad

    type: { // added by cipherNomad
      type: String, // added by cipherNomad
      required: true // added by cipherNomad
    }, // added by cipherNomad

    message: { // added by cipherNomad
      type: String, // added by cipherNomad
      required: true // added by cipherNomad
    }, // added by cipherNomad

    relatedId: { // added by cipherNomad
      type: mongoose.Schema.Types.ObjectId, // added by cipherNomad
      refPath: "typeReference" // added by cipherNomad
    }, // added by cipherNomad

    isRead: { // added by cipherNomad
      type: Boolean, // added by cipherNomad
      default: false // added by cipherNomad
    }, // added by cipherNomad

    createdAt: { // added by cipherNomad
      type: Date, // added by cipherNomad
      default: Date.now // added by cipherNomad
    } // added by cipherNomad
  }, // added by cipherNomad
  { timestamps: false } // added by cipherNomad
); // added by cipherNomad

module.exports = mongoose.model("Notification", notificationSchema); // added by cipherNomad
