const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true 
    },

    caseNumber: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true    
    },

    description: { 
      type: String 
    },

    // ✅ From Shrikant
    translations: {
      type: Object,
      default: {}
    },

    status: {
      type: String,
      enum: ["processing", "ready", "closed"],
      default: "processing"
    },

    // ✅ From Gargi
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    // ✅ Base AI fields
    aiSummary: {
      type: String,
      default: ""
    },

    keyPoints: {
      type: [String],
      default: []
    },

    // ✅ Hybrid document support (merged properly)
    documents: [
      {
        // For reference-based system (Shrikant)
        docId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document"
        },

        // For embedded system (Pranita + Gargi)
        filename: String,
        fileName: String,
        path: String,
        fileUrl: String,

        uploadedAt: { 
          type: Date, 
          default: Date.now 
        }
      }
    ],

    // ✅ From Gargi
    timeline: [
      {
        type: { type: String },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    stageHistory: {
      type: Array,
      default: []
    },

    tasks: [
      {
        text: String,
        status: String,
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// ✅ From Pranita (keep this)
caseSchema.index({ title: 'text', caseNumber: 'text' });

module.exports = mongoose.model("Case", caseSchema);