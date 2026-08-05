const { connectDB, sql } = require("../config/db");

// Lấy danh sách thông báo theo mã tài khoản
const getByUserId = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            SELECT * FROM ThongBao
            WHERE MaTK = @MaTK OR MaKH = @MaTK
            ORDER BY NgayTao DESC
        `);
    return result.recordset;
};

// Đánh dấu 1 thông báo là đã đọc
const markAsRead = async (maTB) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTB", sql.Int, maTB)
        .query(`
            UPDATE ThongBao
            SET DaDoc = 1
            WHERE MaTB = @MaTB
        `);
};

// Đánh dấu tất cả là đã đọc
const markAllAsRead = async (maTK) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            UPDATE ThongBao
            SET DaDoc = 1
            WHERE (MaTK = @MaTK OR MaKH = @MaTK) AND (DaDoc = 0 OR DaDoc IS NULL)
        `);
};

// Xóa 1 thông báo
const deleteNotification = async (maTB) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTB", sql.Int, maTB)
        .query(`
            DELETE FROM ThongBao
            WHERE MaTB = @MaTB
        `);
};

// Xóa tất cả thông báo của 1 tài khoản
const deleteAllNotifications = async (maTK) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            DELETE FROM ThongBao
            WHERE MaTK = @MaTK OR MaKH = @MaTK
        `);
};

// Tạo thông báo mới
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
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification
};