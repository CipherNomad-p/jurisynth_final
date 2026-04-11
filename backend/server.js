const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const User = require("./models/User");
const { backfillMissingClientCodes } = require("./controllers/authController"); // added by cipherNomad

const { protect } = require("./middleware/authMiddleware");
const validateSettings = require("./middleware/validateSettings");

// ✅ ADD (Shrikant feature)
const translationRoutes = require("./routes/translationRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // added by cipherNomad

dotenv.config();
connectDB().then(async () => { // added by cipherNomad
  try { // added by cipherNomad
    const backfilledCount = await backfillMissingClientCodes(); // added by cipherNomad
    console.log(`Client code backfill complete: ${backfilledCount}`); // added by cipherNomad
  } catch (error) { // added by cipherNomad
    console.error("Client code backfill failed:", error.message); // added by cipherNomad
  } // added by cipherNomad
}); // added by cipherNomad

const app = express();

// Security
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);

// Logging
app.use(morgan("dev"));

// Cookies
app.use(cookieParser());

// ✅ CORS (merged from Gargi + Pranita)
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // allow all for now (you can restrict later)
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend running" });
});
//
// ================= USER SETTINGS =================
//

// GET settings
app.get("/api/users/settings", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("aiSettings");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ settings: user.aiSettings });
  } catch (error) {
    next(error);
  }
});

// UPDATE settings
app.patch(
  "/api/users/settings",
  protect,
  validateSettings,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.aiSettings = {
        modelPreference:
          req.body.modelPreference || user.aiSettings?.modelPreference,
        analysisDepth:
          req.body.analysisDepth || user.aiSettings?.analysisDepth,
        simulationMode:
          req.body.simulationMode ?? user.aiSettings?.simulationMode,
      };

      await user.save();

      res.json({
        message: "Settings Updated",
        settings: user.aiSettings,
      });
    } catch (error) {
      next(error);
    }
  }
);

//
// ================= AUTH =================
//

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: false,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(200).json({ message: "Session revoked" });
});

//
// ================= ROUTES =================
//

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cases", require("./routes/caseRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/summary", require("./routes/summaryRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/transcribe", require("./routes/transcribeRoutes"));
app.use("/api/notifications", notificationRoutes); // added by cipherNomad

// ✅ ADD (Shrikant)
app.use("/api", translationRoutes);

//
// ================= TEST ROUTES =================
//

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Protected route working", user: req.user });
});

app.get("/test", (req, res) => {
  res.send("Test route working");
});

app.get("/", (req, res) => {
  res.send("Jurisynth Backend Running");
});

//
// ================= ERROR HANDLER =================
//

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error("[ERROR]", err.message);

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

//
// ================= SERVER =================
//

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Jurisynth Backend running on port ${PORT}`)
);
console.log(`Server accessible at http://0.0.0.0:${PORT}`);