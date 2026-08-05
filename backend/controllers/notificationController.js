const notificationModel = require("../models/notificationModel");

const getNotifications = async (req, res) => {
    try {
        const maTK = req.params.maTK;
        const data = await notificationModel.getByUserId(maTK);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const maTB = req.params.maTB;
        await notificationModel.markAsRead(maTB);
        res.json({ message: "Đã đánh dấu là đã đọc" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const maTK = req.params.maTK;
        await notificationModel.markAllAsRead(maTK);
        res.json({ message: "Đã đánh dấu đọc tất cả" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const maTB = req.params.maTB;
        await notificationModel.deleteNotification(maTB);
        res.json({ message: "Đã xóa thông báo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        const maTK = req.params.maTK;
        await notificationModel.deleteAllNotifications(maTK);
        res.json({ message: "Đã xóa tất cả thông báo" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};