const { connectDB, sql } = require("../config/db");

const getReviewsByProduct = async (maSP) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaSP", sql.Int, maSP)
        .query(`
            SELECT dg.MaDG, dg.SoSao, dg.NoiDung, dg.NgayDG, kh.HoTen
            FROM DanhGia dg
            JOIN KhachHang kh ON dg.MaKH = kh.MaKH
            WHERE dg.MaSP = @MaSP
            ORDER BY dg.NgayDG DESC
        `);
    return result.recordset;
};

const getReviewsByUser = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            SELECT dg.MaDG, dg.SoSao, dg.NoiDung, dg.NgayDG, sp.TenSP, sp.HinhAnh, sp.MaSP
            FROM DanhGia dg
            JOIN KhachHang kh ON dg.MaKH = kh.MaKH
            JOIN SanPham sp ON dg.MaSP = sp.MaSP
            WHERE kh.MaTK = @MaTK
            ORDER BY dg.NgayDG DESC
        `);
    return result.recordset;
};

const checkCanReview = async (maTK, maSP) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .input("MaSP", sql.Int, maSP)
        .query(`
            SELECT TOP 1 1 
            FROM DonHang dh
            JOIN ChiTietDonHang ct ON dh.MaDH = ct.MaDH
            JOIN KhachHang kh ON dh.MaKH = kh.MaKH
            WHERE kh.MaTK = @MaTK AND ct.MaSP = @MaSP
        `);
    return result.recordset.length > 0;
};

const createReview = async (maTK, maSP, soSao, noiDung) => {
    const pool = await connectDB();
    
    // Lấy MaKH từ MaTK
    const khResult = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query("SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK");
    if(khResult.recordset.length === 0) throw new Error("Tài khoản không hợp lệ");
    const maKH = khResult.recordset[0].MaKH;

    await pool.request()
        .input("MaKH", sql.Int, maKH)
        .input("MaSP", sql.Int, maSP)
        .input("SoSao", sql.Int, soSao)
        .input("NoiDung", sql.NVarChar(500), noiDung)
        .query(`
            INSERT INTO DanhGia (MaKH, MaSP, SoSao, NoiDung, NgayDG)
            VALUES (@MaKH, @MaSP, @SoSao, @NoiDung, GETDATE())
        `);
};

module.exports = { getReviewsByProduct, getReviewsByUser, checkCanReview, createReview };