const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "nong_san_shop_secret_key_2026";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Bạn cần đăng nhập" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }
        // decoded = { maTK, email, vaiTro }
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.vaiTro !== "Admin") {
        return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }
    next();
};

module.exports = { verifyToken, isAdmin };