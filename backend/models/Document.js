const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true
    },

    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }, // added by cipherNomad

    uploaderRole: { // added by cipherNomad
      type: String, // added by cipherNomad
      default: "user" // added by cipherNomad
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
