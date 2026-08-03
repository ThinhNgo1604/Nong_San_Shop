const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");


router.post("/register", authController.register);

router.post("/login", authController.login);


// Admin tạo tài khoản Admin
router.post(
    "/register-admin",
    verifyToken,
    isAdmin,
    authController.registerAdmin
);


// Đổi mật khẩu
router.put(
    "/change-password",
    verifyToken,
    authController.changePassword
);


// Xác thực mật khẩu
router.post(
    "/verify-password",
    verifyToken,
    authController.verifyPassword
);


// Cập nhật hồ sơ cá nhân
router.put(
    "/update-profile",
    verifyToken,
    authController.updateProfile
);


module.exports = router;