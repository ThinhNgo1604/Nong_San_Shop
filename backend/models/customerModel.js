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

    await pool.request()
        .input("MaKH", sql.Int, id)
        .input("TrangThai", sql.Bit, status)
        .query(`
            UPDATE TaiKhoan
            SET TrangThai = @TrangThai
            WHERE MaTK = (
                SELECT MaTK
                FROM KhachHang
                WHERE MaKH = @MaKH
            )
        `);

};

module.exports = {
    getAllCustomers,
    updateStatus
};