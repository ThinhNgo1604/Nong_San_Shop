const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ cho phép upload ảnh JPG, JPEG, PNG hoặc WEBP."));
    }
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});