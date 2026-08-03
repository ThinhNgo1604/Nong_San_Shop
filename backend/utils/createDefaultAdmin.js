const bcrypt = require("bcryptjs");
const { connectDB, sql } = require("../config/db");

async function createDefaultAdmin() {
    try {
        const pool = await connectDB();

        // 1. Kiểm tra xem đã tồn tại tài khoản có Email là "admin@gmail.com" HOẶC Tên đăng nhập là "admin" chưa
        const check = await pool.request()
            .input("Email", sql.VarChar, "admin@gmail.com")
            .input("TenDangNhap", sql.VarChar, "admin")
            .query(`
                SELECT TOP 1 *
                FROM TaiKhoan
                WHERE Email = @Email OR TenDangNhap = @TenDangNhap
            `);

        // Nếu đã tồn tại bất kỳ điều kiện nào ở trên, thông báo và dừng lại, không chạy lệnh INSERT nữa
        if (check.recordset.length > 0) {
            const existingUser = check.recordset[0];
            console.log(`✅ Default Admin đã tồn tại trong database (Tên đăng nhập: "${existingUser.TenDangNhap.trim()}", Email: "${existingUser.Email.trim()}").`);
            return;
        }

        // 2. Nếu chưa tồn tại, tiến hành hash mật khẩu và insert
        const hashedPassword = await bcrypt.hash("123456", 10);

        await pool.request()
            .input("TenDangNhap", sql.VarChar, "admin")
            .input("MatKhau", sql.VarChar, hashedPassword)
            .input("Email", sql.VarChar, "admin@gmail.com")
            .input("SoDienThoai", sql.VarChar, "0123456789")
            .input("VaiTro", sql.NVarChar, "Admin")
            .input("TrangThai", sql.Bit, true)
            .query(`
                INSERT INTO TaiKhoan
                (
                    TenDangNhap,
                    MatKhau,
                    Email,
                    SoDienThoai,
                    VaiTro,
                    TrangThai
                )
                VALUES
                (
                    @TenDangNhap,
                    @MatKhau,
                    @Email,
                    @SoDienThoai,
                    @VaiTro,
                    @TrangThai
                )
            `);

        console.log("🎉 Đã tạo tài khoản Admin mặc định thành công!");
        console.log("Email: admin@gmail.com");
        console.log("Password: 123456");

    } catch (err) {
        console.error("❌ Lỗi khi khởi tạo Admin mặc định:", err);
    }
}

module.exports = createDefaultAdmin;