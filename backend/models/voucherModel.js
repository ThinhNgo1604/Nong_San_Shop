const { connectDB, sql } = require("../config/db");

// Lấy tất cả
const getAllVoucher = async () => {
    const pool = await connectDB();

    const result = await pool.request().query(`
        SELECT
            MaGG,
            Code,
            LoaiGiam,
            GiaTriGiam,
            NgayBD,
            NgayKT,
            DieuKienApDung,
            SoLuong,
            SoDiemDoi
        FROM MaGiamGia
        ORDER BY MaGG DESC
    `);

    return result.recordset;
};

// Thêm
const createVoucher = async (voucher) => {

    const pool = await connectDB();

    await pool.request()
        .input("Code", sql.VarChar, voucher.Code)
        .input("LoaiGiam", sql.NVarChar, voucher.LoaiGiam)
        .input("GiaTriGiam", sql.Decimal(18,2), voucher.GiaTriGiam)
        .input("NgayBD", sql.Date, voucher.NgayBD)
        .input("NgayKT", sql.Date, voucher.NgayKT)
        .input("DieuKienApDung", sql.Decimal(18,2), voucher.DieuKienApDung)
        .input("SoLuong", sql.Int, voucher.SoLuong)
        .input("SoDiemDoi", sql.Int, voucher.SoDiemDoi || null)
        .query(`
            INSERT INTO MaGiamGia
            (
                Code,
                LoaiGiam,
                GiaTriGiam,
                NgayBD,
                NgayKT,
                DieuKienApDung,
                SoLuong,
                SoDiemDoi
            )
            VALUES
            (
                @Code,
                @LoaiGiam,
                @GiaTriGiam,
                @NgayBD,
                @NgayKT,
                @DieuKienApDung,
                @SoLuong,
                @SoDiemDoi
            )
        `);

};

// Sửa
const updateVoucher = async (id, voucher) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaGG", sql.Int, id)
        .input("Code", sql.VarChar, voucher.Code)
        .input("LoaiGiam", sql.NVarChar, voucher.LoaiGiam)
        .input("GiaTriGiam", sql.Decimal(18,2), voucher.GiaTriGiam)
        .input("NgayBD", sql.Date, voucher.NgayBD)
        .input("NgayKT", sql.Date, voucher.NgayKT)
        .input("DieuKienApDung", sql.Decimal(18,2), voucher.DieuKienApDung)
        .input("SoLuong", sql.Int, voucher.SoLuong)
        .input("SoDiemDoi", sql.Int, voucher.SoDiemDoi || null)
        .query(`
            UPDATE MaGiamGia
            SET
                Code=@Code,
                LoaiGiam=@LoaiGiam,
                GiaTriGiam=@GiaTriGiam,
                NgayBD=@NgayBD,
                NgayKT=@NgayKT,
                DieuKienApDung=@DieuKienApDung,
                SoLuong=@SoLuong,
                SoDiemDoi=@SoDiemDoi
            WHERE MaGG=@MaGG
        `);

};

// Xóa
const deleteVoucher = async (id) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaGG", sql.Int, id)
        .query(`
            DELETE FROM MaGiamGia
            WHERE MaGG=@MaGG
        `);

};
// Kiểm tra Code đã tồn tại chưa
const checkCodeExists = async (code, id = null) => {

    const pool = await connectDB();

    let query = `
        SELECT MaGG
        FROM MaGiamGia
        WHERE Code = @Code
    `;

    const request = pool.request()
        .input("Code", sql.VarChar, code);

    // Khi sửa thì bỏ qua chính voucher đang sửa
    if (id) {

        query += " AND MaGG <> @MaGG";

        request.input("MaGG", sql.Int, id);

    }

    const result = await request.query(query);

    return result.recordset.length > 0;

};

const getActiveVouchers = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
        SELECT MaGG, Code, LoaiGiam, GiaTriGiam, NgayBD, NgayKT, DieuKienApDung, SoLuong
        FROM MaGiamGia
        WHERE SoLuong > 0 AND NgayKT >= CAST(GETDATE() AS DATE)
        ORDER BY NgayKT ASC
    `);
    return result.recordset;
};

// Tra MaKH từ MaTK (giống taskModel)
const getMaKHByMaTK = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", maTK)
        .query(`SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK`);
    return result.recordset[0]?.MaKH;
};
 
// Tổng điểm hiện có (giống taskModel.getTotalPoints)
const getTotalPoints = async (maKH) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaKH", maKH)
        .query(`
            SELECT
                ISNULL(SUM(CASE WHEN LoaiDiem = N'Cộng' THEN SoDiem ELSE 0 END), 0) -
                ISNULL(SUM(CASE WHEN LoaiDiem = N'Trừ' THEN SoDiem ELSE 0 END), 0) AS tongDiem
            FROM LichSuDiem
            WHERE MaKH = @MaKH
        `);
    return result.recordset[0].tongDiem;
};
 
// Danh sách voucher có thể đổi bằng điểm (còn hạn, còn số lượng, có gán điểm đổi)
const getRedeemableVouchers = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
        SELECT MaGG, Code, LoaiGiam, GiaTriGiam, NgayBD, NgayKT, DieuKienApDung, SoLuong, SoDiemDoi
        FROM MaGiamGia
        WHERE SoDiemDoi IS NOT NULL AND SoLuong > 0 AND NgayKT >= CAST(GETDATE() AS DATE)
        ORDER BY SoDiemDoi ASC
    `);
    return result.recordset;
};
 
// Danh sách voucher khách hàng đã đổi (ví voucher cá nhân)
const getMyVouchers = async (maKH) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaKH", maKH)
        .query(`
            SELECT kv.MaKHV, kv.NgayDoi, kv.DaSuDung,
                   mg.MaGG, mg.Code, mg.LoaiGiam, mg.GiaTriGiam, mg.NgayKT, mg.DieuKienApDung
            FROM KhachHang_Voucher kv
            JOIN MaGiamGia mg ON kv.MaGG = mg.MaGG
            WHERE kv.MaKH = @MaKH
            ORDER BY kv.NgayDoi DESC
        `);
    return result.recordset;
};
 
// Kiểm tra khách hàng này đã đổi voucher này chưa
const checkAlreadyRedeemed = async (maKH, maGG) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaKH", maKH)
        .input("MaGG", maGG)
        .query(`SELECT MaKHV FROM KhachHang_Voucher WHERE MaKH = @MaKH AND MaGG = @MaGG`);
    return result.recordset.length > 0;
};
 
// Thực hiện đổi voucher: trừ điểm + trừ số lượng voucher + ghi vào ví khách hàng
const redeemVoucher = async (maKH, voucher) => {
    const pool = await connectDB();
 
    await pool.request()
        .input("MaKH", sql.Int, maKH)
        .input("MaGG", sql.Int, voucher.MaGG)
        .input("SoDiem", sql.Int, voucher.SoDiemDoi)
        .input("GhiChu", sql.NVarChar, `Đổi voucher: ${voucher.Code}`)
        .query(`
            BEGIN TRAN;
 
            -- Trừ số lượng voucher còn lại
            UPDATE MaGiamGia SET SoLuong = SoLuong - 1 WHERE MaGG = @MaGG AND SoLuong > 0;
 
            -- Thêm vào ví voucher của khách hàng
            INSERT INTO KhachHang_Voucher (MaKH, MaGG, NgayDoi, DaSuDung)
            VALUES (@MaKH, @MaGG, GETDATE(), 0);
 
            -- Trừ điểm, ghi lịch sử
            INSERT INTO LichSuDiem (MaKH, LoaiDiem, LoaiGD, SoDiem, NgayThucHien, GhiChu)
            VALUES (@MaKH, N'Trừ', N'Đổi voucher', @SoDiem, GETDATE(), @GhiChu);
 
            COMMIT TRAN;
        `);
};

module.exports = {
    getAllVoucher,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    checkCodeExists,
    getActiveVouchers,
    getMaKHByMaTK,
    getTotalPoints,
    getRedeemableVouchers,
    getMyVouchers,
    checkAlreadyRedeemed,
    redeemVoucher
};