const express = require("express"); // added by cipherNomad
const router = express.Router(); // added by cipherNomad
const { protect } = require("../middleware/authMiddleware"); // added by cipherNomad
const { getNotifications, markNotificationRead, sendClientNotification } = require("../controllers/notificationController"); // added by cipherNomad

router.use(protect); // added by cipherNomad

router.get("/", getNotifications); // added by cipherNomad
router.patch("/:id/read", markNotificationRead); // added by cipherNomad
router.post("/client-request", sendClientNotification);

module.exports = router; // added by cipherNomad
