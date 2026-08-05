const { connectDB, sql } = require("../config/db");

const getAllCustomers = async () => {

    const pool = await connectDB();

    const result = await pool.request().query(`
        SELECT
            kh.MaKH,
            kh.HoTen,
            kh.GioiTinh,
            kh.NgaySinh,
            kh.DiaChi,
            kh.DiemXepHang,
            kh.DiemThuong,

            tk.Email,
            tk.SoDienThoai,
            tk.TrangThai

        FROM KhachHang kh
        INNER JOIN TaiKhoan tk
            ON kh.MaTK = tk.MaTK

        ORDER BY kh.MaKH
    `);

    return result.recordset;

};

const updateStatus = async (id, status) => {

    const pool = await connectDB();
    const boolStatus = status === true || status === 1 || status === "1" || status === "true";

    await pool.request()
        .input("MaKH", sql.Int, id)
        .input("TrangThai", sql.Bit, boolStatus)
        .query(`
            UPDATE TaiKhoan
            SET TrangThai = @TrangThai
            WHERE MaTK = (
                SELECT MaTK
                FROM KhachHang
                WHERE MaKH = @MaKH
            ) OR MaTK = @MaKH;

            UPDATE KhachHang
            SET TrangThai = @TrangThai
            WHERE MaKH = @MaKH OR MaTK = @MaKH;
        `);

};

module.exports = {
    getAllCustomers,
    updateStatus
};