const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Lấy thông báo theo mã tài khoản
router.get("/:maTK", notificationController.getNotifications);

// Đánh dấu đã đọc 1 thông báo
router.put("/read/:maTB", notificationController.markAsRead);

// Đánh dấu đã đọc tất cả thông báo
router.put("/read-all/:maTK", notificationController.markAllAsRead);

// Xóa 1 thông báo
router.delete("/:maTB", notificationController.deleteNotification);

// Xóa tất cả thông báo của 1 tài khoản
router.delete("/delete-all/:maTK", notificationController.deleteAllNotifications);

module.exports = router;