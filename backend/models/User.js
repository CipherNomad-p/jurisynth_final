const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String
    },

    role: {
      type: String,
      enum: ["user", "advocate"], 
      default: "user"
    },

    googleId: {
      type: String
    },

    createdBy: { // added by cipherNomad
      type: mongoose.Schema.Types.ObjectId, // added by cipherNomad
      ref: "User" // added by cipherNomad
    }, // added by cipherNomad

    clientCode: { // added by cipherNomad
      type: String, // added by cipherNomad
      unique: true, // added by cipherNomad
      sparse: true, // added by cipherNomad
      uppercase: true, // added by cipherNomad
      trim: true // added by cipherNomad
    }, // added by cipherNomad

    aiSettings: {
      modelPreference: { 
        type: String, 
        default: "Gemini 2.5 Flash" 
      },
      analysisDepth: { 
        type: String, 
        default: "Comprehensive" 
      },
      simulationMode: { 
        type: Boolean, 
        default: false 
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
