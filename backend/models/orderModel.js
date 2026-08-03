const { connectDB, sql } = require("../config/db");

const getAllOrders = async (status, fromDate, toDate) => {
    const pool = await connectDB();
    
    // Khởi tạo câu truy vấn cơ bản với điều kiện WHERE 1=1 để dễ nối chuỗi
    let query = `
        SELECT
            dh.MaDH,
            kh.HoTen AS TenKhachHang,
            dc.HoTen AS NguoiNhan,
            dc.SoDienThoai,
            dc.DiaChiChiTiet,
            dh.NgayDat,
            dh.PhiVanChuyen,
            dh.TongTien,
            dh.TrangThaiDonHang,
            dh.TrangThaiThanhToan
        FROM DonHang dh
        INNER JOIN KhachHang kh ON dh.MaKH = kh.MaKH
        LEFT JOIN SoDiaChi dc ON dh.MaDC = dc.MaDC
        WHERE 1=1
    `;

    const request = pool.request();

    // Nối thêm điều kiện nếu có truyền vào
    if (status) {
        query += ` AND dh.TrangThaiDonHang = @Status`;
        request.input("Status", sql.NVarChar, status);
    }
    
    if (fromDate) {
        // Ép kiểu về DATE để chỉ so sánh ngày, bỏ qua giờ phút
        query += ` AND CAST(dh.NgayDat AS DATE) >= @FromDate`;
        request.input("FromDate", sql.Date, fromDate);
    }
    
    if (toDate) {
        query += ` AND CAST(dh.NgayDat AS DATE) <= @ToDate`;
        request.input("ToDate", sql.Date, toDate);
    }

    query += ` ORDER BY dh.MaDH DESC`;

    const result = await request.query(query);
    return result.recordset;
};

const getOrderDetail = async (id) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaDH", id)
        .query(`
            SELECT
                sp.TenSP,
                ct.SoLuong,
                ct.DonGia,
                ct.ThanhTien
            FROM ChiTietDonHang ct
            INNER JOIN SanPham sp ON ct.MaSP = sp.MaSP
            WHERE ct.MaDH = @MaDH
        `);
    return result.recordset;
};

const updateStatus = async (id, status, paymentStatus) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaDH", id)
        .input("TrangThaiDonHang", status)
        .input("TrangThaiThanhToan", paymentStatus)
        .query(`
            UPDATE DonHang
            SET TrangThaiDonHang = @TrangThaiDonHang,
                TrangThaiThanhToan = @TrangThaiThanhToan
            WHERE MaDH = @MaDH
        `);
};

const getOrdersByUser = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            SELECT dh.MaDH, dh.NgayDat, dh.TongTien, dh.TrangThaiDonHang, dh.TrangThaiThanhToan
            FROM DonHang dh
            INNER JOIN KhachHang kh ON dh.MaKH = kh.MaKH
            WHERE kh.MaTK = @MaTK
            ORDER BY dh.NgayDat DESC
        `);
    return result.recordset;
};

const getOrderStatusById = async (id) => {

    const pool = await connectDB();

    const result = await pool.request()

        .input("MaDH", id)

        .query(`
            SELECT
                TrangThaiDonHang,
                TrangThaiThanhToan
            FROM DonHang
            WHERE MaDH = @MaDH
        `);

    return result.recordset[0];

};

// Cập nhật riêng trạng thái thanh toán (dùng cho MoMo IPN / check-status / SePay webhook)
const updatePaymentStatus = async (maDH, trangThaiThanhToan) => {
    const pool = await connectDB();
    await pool.request()
        .input("MaDH", sql.Int, maDH)
        .input("TrangThaiThanhToan", sql.NVarChar(50), trangThaiThanhToan)
        .query(`
            UPDATE DonHang
            SET TrangThaiThanhToan = @TrangThaiThanhToan
            WHERE MaDH = @MaDH
        `);
};

// Lấy riêng trạng thái thanh toán (dùng cho frontend polling khi chờ VietQR/SePay)
const getPaymentStatusById = async (maDH) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaDH", sql.Int, maDH)
        .query(`SELECT TrangThaiThanhToan FROM DonHang WHERE MaDH = @MaDH`);
    return result.recordset[0];
};

module.exports = {
    getAllOrders,
    getOrderDetail,
    updateStatus,
    getOrdersByUser,
    getOrderStatusById,
    updatePaymentStatus,
    getPaymentStatusById
};