const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Lấy thông báo
router.get("/:maTK", notificationController.getNotifications);

// Đánh dấu đã đọc
router.put("/read-all/:maTK", notificationController.markAllAsRead);

module.exports = router;