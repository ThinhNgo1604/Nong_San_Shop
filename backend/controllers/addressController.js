const { connectDB, sql } = require("../config/db");

// 1. Lấy danh sách địa chỉ của Khách hàng
const getAddresses = async (req, res) => {
    try {
        const maTK = req.params.maTK;
        const pool = await connectDB();

        // Đổi MaTK thành MaKH
        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        if (khResult.recordset.length === 0) return res.json([]);
        const maKH = khResult.recordset[0].MaKH;

        // Lấy địa chỉ, ưu tiên địa chỉ mặc định (MacDinh = 1) lên đầu
        const result = await pool.request()
            .input('MaKH', sql.Int, maKH)
            .query('SELECT * FROM SoDiaChi WHERE MaKH = @MaKH ORDER BY MacDinh DESC, MaDC DESC');

        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 2. Thêm địa chỉ mới
const addAddress = async (req, res) => {
    try {
        const { maTK, hoTen, soDienThoai, diaChiChiTiet, macDinh } = req.body;
        const pool = await connectDB();

        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        if (khResult.recordset.length === 0) return res.status(400).json({ message: "Tài khoản không hợp lệ" });
        const maKH = khResult.recordset[0].MaKH;

        // Nếu người dùng chọn đây là địa chỉ mặc định, ta phải đưa các địa chỉ cũ về 0
        if (macDinh) {
            await pool.request().input('MaKH', sql.Int, maKH).query('UPDATE SoDiaChi SET MacDinh = 0 WHERE MaKH = @MaKH');
        }

        await pool.request()
            .input('MaKH', sql.Int, maKH)
            .input('HoTen', sql.NVarChar(100), hoTen)
            .input('SoDienThoai', sql.VarChar(15), soDienThoai)
            .input('DiaChiChiTiet', sql.NVarChar(500), diaChiChiTiet)
            .input('MacDinh', sql.Bit, macDinh ? 1 : 0)
            .query('INSERT INTO SoDiaChi (MaKH, HoTen, SoDienThoai, DiaChiChiTiet, MacDinh) VALUES (@MaKH, @HoTen, @SoDienThoai, @DiaChiChiTiet, @MacDinh)');

        res.json({ message: "Thêm địa chỉ thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 3. Đặt địa chỉ làm mặc định
const setDefault = async (req, res) => {
    try {
        const { maTK, maDC } = req.body;
        const pool = await connectDB();

        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        const maKH = khResult.recordset[0].MaKH;

        // Set tất cả về 0, sau đó set địa chỉ được chọn thành 1
        await pool.request().input('MaKH', sql.Int, maKH).query('UPDATE SoDiaChi SET MacDinh = 0 WHERE MaKH = @MaKH');
        await pool.request()
            .input('MaDC', sql.Int, maDC)
            .input('MaKH', sql.Int, maKH)
            .query('UPDATE SoDiaChi SET MacDinh = 1 WHERE MaDC = @MaDC AND MaKH = @MaKH');

        res.json({ message: "Cập nhật địa chỉ mặc định thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = { getAddresses, addAddress, setDefault };