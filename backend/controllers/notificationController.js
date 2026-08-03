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

module.exports = {
    getNotifications,
    markAllAsRead
};