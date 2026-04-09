const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware"); // added by cipherNomad
const { register, login, googleLogin, createClient, getMyClients, verifyClientByCode, getMe, ensureMyClientCode } = require("../controllers/authController"); // added by cipherNomad

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe); // added by cipherNomad
router.post("/client-code/ensure", protect, ensureMyClientCode); // added by cipherNomad
router.post("/clients", protect, authorize("advocate"), createClient); // added by cipherNomad
router.get("/clients", protect, authorize("advocate"), getMyClients); // added by cipherNomad
router.get("/clients/verify", protect, authorize("advocate"), verifyClientByCode); // added by cipherNomad
router.get("/clients/verify/:clientCode", protect, authorize("advocate"), verifyClientByCode); // added by cipherNomad

module.exports = router;
