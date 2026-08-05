const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authModel = require("../models/authModel");
const notificationModel = require("../models/notificationModel"); // Đã thêm Model thông báo

const JWT_SECRET = process.env.JWT_SECRET || "nong_san_shop_secret_key_2026";

// ===== ĐĂNG KÝ =====
const register = async (req, res) => {
    try {
        const { hoTen, email, soDienThoai, password } = req.body;

        if (!hoTen || !email || !soDienThoai || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        const existingUser = await authModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Dùng email làm tên đăng nhập cho đơn giản
        const maTK = await authModel.createTaiKhoan(email, hashedPassword, email, soDienThoai);
        await authModel.createKhachHang(maTK, hoTen);

        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// ===== ĐĂNG NHẬP =====
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
        }

        const user = await authModel.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // Kiểm tra tài khoản bị khóa
        const isAdminUser = (user.VaiTro || "").toString().trim().toLowerCase() === "admin" || (user.Email || "").toLowerCase() === "admin@gmail.com";
        const isLocked = !isAdminUser && (
            user.TrangThai === false ||
            user.TrangThai === 0 ||
            user.TrangThai === "0" ||
            user.TrangThai === "false" ||
            user.TrangThai === "Khoá" ||
            user.TrangThai === "Đã khóa"
        );

        if (isLocked) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ quản trị viên." });
        }

        const isMatch = await bcrypt.compare(password, user.MatKhau);
        if (!isMatch) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        const token = jwt.sign(
            { maTK: user.MaTK, email: user.Email, vaiTro: user.VaiTro || "Khách hàng" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Đăng nhập thành công",
            token,
            user: {
                maTK: user.MaTK,
                email: user.Email,
                vaiTro: (user.VaiTro || "Khách hàng").toString().trim(),
                HoTen: user.HoTen || "",
                SoDienThoai: user.SoDienThoai || "",
                avatarUrl: user.HinhAnh || user.AvatarKhachHang || "",
                HinhAnh: user.HinhAnh || user.AvatarKhachHang || "",
                GioiTinh: user.GioiTinh || "",
                NgaySinh: user.NgaySinh || "",
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};


// ===== TẠO ADMIN =====
const registerAdmin = async (req, res) => {
    try {
        const { tenDangNhap, email, matKhau, soDienThoai } = req.body;

        if (!email || !matKhau || !tenDangNhap) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        const existingUser = await authModel.findByEmail(email);

        if (existingUser) {
            return res.status(400).json({
                message: "Email đã được sử dụng"
            });
        }

        const hashedPassword = await bcrypt.hash(matKhau, 10);

        const maTK = await authModel.createAdmin(
            tenDangNhap,
            hashedPassword,
            email,
            soDienThoai
        );

        res.status(201).json({
            message: "Tạo tài khoản Admin thành công",
            maTK,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};


// ===== ĐỔI MẬT KHẨU =====
const changePassword = async (req, res) => {
    try {
        const maTK = req.user.maTK;
        const { matKhauCu, matKhauMoi } = req.body;

        if (!matKhauCu || !matKhauMoi) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới"
            });
        }

        const user = await authModel.findById(maTK);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng"
            });
        }

        const isMatch = await bcrypt.compare(matKhauCu, user.MatKhau);

        if (!isMatch) {
            return res.status(400).json({
                message: "Mật khẩu cũ không đúng"
            });
        }

        const hashedNewPassword = await bcrypt.hash(matKhauMoi, 10);

        await authModel.updatePassword(maTK, hashedNewPassword);

        // --- TẠO THÔNG BÁO ---
        try {
            await notificationModel.createNotification(
                maTK,
                'account',
                'Cập nhật mật khẩu thành công 🔒',
                'Mật khẩu tài khoản của bạn đã được thay đổi an toàn. Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.'
            );
        } catch (errNotify) {
            console.error("Lỗi gửi thông báo đổi mật khẩu:", errNotify);
        }
        // ---------------------

        res.status(200).json({
            message: "Đổi mật khẩu thành công"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};


// ===== XÁC THỰC MẬT KHẨU =====
const verifyPassword = async (req, res) => {
    try {
        const maTK = req.user.maTK;
        const { password } = req.body;

        const user = await authModel.findById(maTK);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng"
            });
        }

        const isMatch = await bcrypt.compare(password, user.MatKhau);

        if (!isMatch) {
            return res.status(400).json({
                valid: false,
                message: "Mật khẩu không chính xác"
            });
        }

        res.json({
            valid: true,
            message: "Xác thực thành công"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// ===== LẤY THÔNG TIN HỒ SƠ =====
const getProfile = async (req, res) => {
    try {
        const maTK = req.user.maTK;
        const user = await authModel.findById(maTK);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const avatar = user.HinhAnh || user.AvatarKhachHang || "";

        res.status(200).json({
            user: {
                maTK: user.MaTK,
                email: user.Email,
                vaiTro: (user.VaiTro || "Khách hàng").toString().trim(),
                HoTen: user.HoTen || "",
                SoDienThoai: user.SoDienThoai || "",
                avatarUrl: avatar,
                HinhAnh: avatar,
                GioiTinh: user.GioiTinh || "",
                NgaySinh: user.NgaySinh || "",
            }
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin hồ sơ:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// ===== CẬP NHẬT HỒ SƠ =====
const updateProfile = async (req, res) => {
    try {
        const maTK = req.user.maTK;
        const { hoTen, soDienThoai, gioiTinh, ngaySinh, avatarUrl } = req.body;

        if (!hoTen && !soDienThoai && !avatarUrl && !gioiTinh && !ngaySinh) {
            return res.status(400).json({
                message: "Không có thông tin nào để cập nhật"
            });
        }

        await authModel.updateProfile(maTK, { hoTen, soDienThoai, gioiTinh, ngaySinh, avatarUrl });

        const updatedUser = await authModel.findById(maTK);
        const avatar = updatedUser?.HinhAnh || updatedUser?.AvatarKhachHang || avatarUrl || "";

        res.status(200).json({
            message: "Cập nhật hồ sơ thành công",
            user: {
                maTK: updatedUser?.MaTK || maTK,
                email: updatedUser?.Email || req.user.email,
                vaiTro: (updatedUser?.VaiTro || req.user.vaiTro || "Khách hàng").toString().trim(),
                HoTen: updatedUser?.HoTen || hoTen || "",
                SoDienThoai: updatedUser?.SoDienThoai || soDienThoai || "",
                avatarUrl: avatar,
                HinhAnh: avatar,
                GioiTinh: updatedUser?.GioiTinh || gioiTinh || "",
                NgaySinh: updatedUser?.NgaySinh || ngaySinh || "",
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

module.exports = {
    register,
    login,
    registerAdmin,
    changePassword,
    verifyPassword,
    getProfile,
    updateProfile
};