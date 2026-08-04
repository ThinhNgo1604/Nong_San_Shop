const { connectDB, sql } = require("../config/db");

// 1. Lấy danh sách địa chỉ của Khách hàng
const getAddresses = async (req, res) => {
    try {
        const maTK = req.params.maTK;
        const pool = await connectDB();

        let maKH = maTK;
        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        if (khResult.recordset && khResult.recordset.length > 0) {
            maKH = khResult.recordset[0].MaKH;
        }

        const result = await pool.request()
            .input('MaKH', sql.Int, maKH)
            .input('MaTK', sql.Int, maTK)
            .query('SELECT * FROM SoDiaChi WHERE MaKH = @MaKH OR MaTK = @MaTK ORDER BY MacDinh DESC, MaDC DESC');

        res.json(result.recordset || []);
    } catch (error) {
        console.error("Lỗi getAddresses:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 2. Thêm địa chỉ mới
const addAddress = async (req, res) => {
    try {
        const { maTK, hoTen, soDienThoai, diaChiChiTiet, macDinh } = req.body;
        if (!maTK || !hoTen || !soDienThoai || !diaChiChiTiet) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }
        const pool = await connectDB();

        let maKH = maTK;
        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        if (khResult.recordset && khResult.recordset.length > 0) {
            maKH = khResult.recordset[0].MaKH;
        }

        // Kiểm tra địa chỉ hiện tại
        const existingList = await pool.request()
            .input('MaKH', sql.Int, maKH)
            .input('MaTK', sql.Int, maTK)
            .query('SELECT * FROM SoDiaChi WHERE MaKH = @MaKH OR MaTK = @MaTK');

        const isDefault = macDinh || (!existingList.recordset || existingList.recordset.length === 0);

        if (isDefault) {
            await pool.request()
                .input('MaKH', sql.Int, maKH)
                .input('MaTK', sql.Int, maTK)
                .query('UPDATE SoDiaChi SET MacDinh = 0 WHERE MaKH = @MaKH OR MaTK = @MaTK');
        }

        await pool.request()
            .input('MaKH', sql.Int, maKH)
            .input('MaTK', sql.Int, maTK)
            .input('HoTen', sql.NVarChar(100), hoTen)
            .input('SoDienThoai', sql.VarChar(15), soDienThoai)
            .input('DiaChiChiTiet', sql.NVarChar(500), diaChiChiTiet)
            .input('MacDinh', sql.Bit, isDefault ? 1 : 0)
            .query('INSERT INTO SoDiaChi (MaKH, MaTK, HoTen, SoDienThoai, DiaChiChiTiet, MacDinh) VALUES (@MaKH, @MaTK, @HoTen, @SoDienThoai, @DiaChiChiTiet, @MacDinh)');

        res.json({ message: "Thêm địa chỉ thành công" });
    } catch (error) {
        console.error("Lỗi addAddress:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 3. Cập nhật địa chỉ
const updateAddress = async (req, res) => {
    try {
        const maDC = req.params.maDC || req.body.maDC;
        const { maTK, hoTen, soDienThoai, diaChiChiTiet, macDinh } = req.body;
        if (!maDC || !hoTen || !soDienThoai || !diaChiChiTiet) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }
        const pool = await connectDB();

        let maKH = maTK;
        if (maTK) {
            const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
            if (khResult.recordset && khResult.recordset.length > 0) {
                maKH = khResult.recordset[0].MaKH;
            }
        }

        if (macDinh && maTK) {
            await pool.request()
                .input('MaKH', sql.Int, maKH)
                .input('MaTK', sql.Int, maTK)
                .query('UPDATE SoDiaChi SET MacDinh = 0 WHERE MaKH = @MaKH OR MaTK = @MaTK');
        }

        await pool.request()
            .input('MaDC', sql.Int, maDC)
            .input('HoTen', sql.NVarChar(100), hoTen)
            .input('SoDienThoai', sql.VarChar(15), soDienThoai)
            .input('DiaChiChiTiet', sql.NVarChar(500), diaChiChiTiet)
            .input('MacDinh', sql.Bit, macDinh ? 1 : 0)
            .query('UPDATE SoDiaChi SET HoTen = @HoTen, SoDienThoai = @SoDienThoai, DiaChiChiTiet = @DiaChiChiTiet, MacDinh = @MacDinh WHERE MaDC = @MaDC');

        res.json({ message: "Cập nhật địa chỉ thành công" });
    } catch (error) {
        console.error("Lỗi updateAddress:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 4. Xóa địa chỉ
const deleteAddress = async (req, res) => {
    try {
        const maDC = req.params.maDC;
        const maTK = req.query.maTK || req.body.maTK;
        const pool = await connectDB();

        await pool.request()
            .input('MaDC', sql.Int, maDC)
            .query('DELETE FROM SoDiaChi WHERE MaDC = @MaDC');

        if (maTK) {
            let maKH = maTK;
            const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
            if (khResult.recordset && khResult.recordset.length > 0) {
                maKH = khResult.recordset[0].MaKH;
            }

            const checkDefault = await pool.request()
                .input('MaKH', sql.Int, maKH)
                .input('MaTK', sql.Int, maTK)
                .query('SELECT * FROM SoDiaChi WHERE (MaKH = @MaKH OR MaTK = @MaTK) AND MacDinh = 1');

            if (!checkDefault.recordset || checkDefault.recordset.length === 0) {
                const remaining = await pool.request()
                    .input('MaKH', sql.Int, maKH)
                    .input('MaTK', sql.Int, maTK)
                    .query('SELECT TOP 1 * FROM SoDiaChi WHERE MaKH = @MaKH OR MaTK = @MaTK ORDER BY MaDC DESC');

                if (remaining.recordset && remaining.recordset.length > 0) {
                    const firstDC = remaining.recordset[0].MaDC;
                    await pool.request().input('MaDC', sql.Int, firstDC).query('UPDATE SoDiaChi SET MacDinh = 1 WHERE MaDC = @MaDC');
                }
            }
        }

        res.json({ message: "Xóa địa chỉ thành công" });
    } catch (error) {
        console.error("Lỗi deleteAddress:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 5. Đặt địa chỉ làm mặc định
const setDefault = async (req, res) => {
    try {
        const { maTK, maDC } = req.body;
        const pool = await connectDB();

        let maKH = maTK;
        const khResult = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');
        if (khResult.recordset && khResult.recordset.length > 0) {
            maKH = khResult.recordset[0].MaKH;
        }

        await pool.request()
            .input('MaKH', sql.Int, maKH)
            .input('MaTK', sql.Int, maTK)
            .query('UPDATE SoDiaChi SET MacDinh = 0 WHERE MaKH = @MaKH OR MaTK = @MaTK');

        await pool.request()
            .input('MaDC', sql.Int, maDC)
            .query('UPDATE SoDiaChi SET MacDinh = 1 WHERE MaDC = @MaDC');

        res.json({ message: "Cập nhật địa chỉ mặc định thành công" });
    } catch (error) {
        console.error("Lỗi setDefault:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress, setDefault };
