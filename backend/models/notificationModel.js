const { connectDB, sql } = require("../config/db");

// Lấy danh sách thông báo theo mã tài khoản
const getByUserId = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            SELECT * FROM ThongBao
            WHERE MaTK = @MaTK
            ORDER BY NgayTao DESC
        `);
    return result.recordset;
};

// Đánh dấu tất cả là đã đọc
const markAllAsRead = async (maTK) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            UPDATE ThongBao
            SET DaDoc = 1
            WHERE MaTK = @MaTK AND DaDoc = 0
        `);
};

// Hàm này để dành: Dùng khi muốn TẠO thông báo mới từ các controller khác (Ví dụ lúc đổi mật khẩu)
const createNotification = async (maTK, loai, tieuDe, noiDung) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTK", sql.Int, maTK)
        .input("Loai", sql.VarChar, loai)
        .input("TieuDe", sql.NVarChar, tieuDe)
        .input("NoiDung", sql.NVarChar, noiDung)
        .query(`
            INSERT INTO ThongBao (MaTK, Loai, TieuDe, NoiDung)
            VALUES (@MaTK, @Loai, @TieuDe, @NoiDung)
        `);
};

module.exports = {
    getByUserId,
    markAllAsRead,
    createNotification
};