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

    translations: {
      type: Object,
      default: {}
    },

    status: {
      type: String,
      enum: ["processing", "ready", "closed"],
      default: "processing"
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium"
    },

    aiSummary: {
      type: String,
      default: ""
    },

    keyPoints: {
      type: [String],
      default: []
    },

    judgement: {
      type: String,
      default: ""
    },

    judgementAt: {
      type: Date
    },

    judgementBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    judgementByName: {
      type: String,
      default: ""
    },

    hearings: [
      {
        number: {
          type: Number,
          required: true
        },
        notes: {
          type: String,
          default: ""
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        createdByName: {
          type: String,
          default: ""
        }
      }
    ],

    clients: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        name: String,
        email: String,
        assignedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    documents: [
      {
        docId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document"
        },
        name: String,
        filename: String,
        fileName: String,
        path: String,
        fileUrl: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        uploadedByName: {
          type: String,
          default: ""
        },
        priority: {
          type: String,
          enum: ["high", "medium", "low"],
          default: "low"
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    evidence: [
      {
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

    recycleBin: [
      {
        filename: String,
        fileName: String,
        path: String,
        fileUrl: String,
        source: {
          type: String,
          enum: ["documents", "evidence"]
        },
        deletedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    timeline: [
      {
        type: { type: String },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    stageHistory: {
      type: Array,
      default: []
    },

    tasks: [
      {
        text: String,
        status: String
      }
    ],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    clientId: { // added by cipherNomad
      type: mongoose.Schema.Types.ObjectId, // added by cipherNomad
      ref: "User" // added by cipherNomad
    }, // added by cipherNomad

    advocateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

caseSchema.index({ title: "text", caseNumber: "text" });

module.exports = mongoose.model("Case", caseSchema);
