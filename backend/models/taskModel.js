const { connectDB } = require("../config/db");

// Tra MaKH từ MaTK (vì token chỉ chứa maTK)
const getMaKHByMaTK = async (maTK) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaTK", maTK)
        .query(`SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK`);
    return result.recordset[0]?.MaKH;
};

// Lấy danh sách nhiệm vụ đang áp dụng
const getAllTasks = async () => {
    const pool = await connectDB();
    const result = await pool.request().query(`
        SELECT MaNV, TenNV, MoTa, SoDiemThuong, LoaiDieuKien
        FROM NhiemVu
        WHERE TrangThai = 1
    `);
    return result.recordset;
};

// Lấy danh sách MaNV đã nhận điểm trong hôm nay
const getClaimedToday = async (maKH) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input("MaKH", maKH)
        .query(`
            SELECT MaNV FROM KhachHang_NhiemVu
            WHERE MaKH = @MaKH AND NgayNhan = CAST(GETDATE() AS DATE)
        `);
    return result.recordset.map(r => r.MaNV);
};

// Kiểm tra 1 loại điều kiện đã đủ hoàn thành chưa (dựa vào hành động thật trong ngày)
// LƯU Ý: sửa lại tên cột ngày (NgayTao/NgayDatHang/NgayDanhGia) cho khớp đúng bảng thật của bạn
const checkCondition = async (maKH, loaiDieuKien) => {
    const pool = await connectDB();
    const request = pool.request().input("MaKH", maKH);

    let query = "";
    switch (loaiDieuKien) {
        case "DangNhap":
            // Đăng nhập thì luôn coi là đủ điều kiện (họ đang online)
            return true;

        case "ThemGioHang":
            query = `
                SELECT COUNT(ct.MaSP) AS soLuong 
                FROM GioHang gh
                JOIN ChiTietGioHang ct ON gh.MaGH = ct.MaGH
                WHERE gh.MaKH = @MaKH
            `;
            break;

        case "DatHang":
            query = `
                SELECT COUNT(*) AS soLuong FROM DonHang
                WHERE MaKH = @MaKH AND CAST(NgayDat AS DATE) = CAST(GETDATE() AS DATE)
            `;
            break;

        case "DanhGia":
            query = `
                SELECT COUNT(*) AS soLuong FROM DanhGia
                WHERE MaKH = @MaKH AND CAST(NgayDG AS DATE) = CAST(GETDATE() AS DATE)
            `;
            break;

        default:
            return false;
    }

    const result = await request.query(query);
    return result.recordset[0].soLuong > 0;
};

// Ghi nhận nhận điểm: thêm vào KhachHang_NhiemVu + LichSuDiem
const claimTask = async (maKH, task) => {
    const pool = await connectDB();

    // 1. Đánh dấu đã nhận hôm nay
    await pool.request()
        .input("MaKH", maKH)
        .input("MaNV", task.MaNV)
        .query(`
            INSERT INTO KhachHang_NhiemVu (MaKH, MaNV, NgayNhan)
            VALUES (@MaKH, @MaNV, CAST(GETDATE() AS DATE))
        `);

    // 2. Ghi lịch sử cộng điểm
    await pool.request()
        .input("MaKH", maKH)
        .input("SoDiem", task.SoDiemThuong)
        .input("GhiChu", `Hoàn thành nhiệm vụ: ${task.TenNV}`)
        .query(`
            INSERT INTO LichSuDiem (MaKH, LoaiDiem, LoaiGD, SoDiem, NgayThucHien, GhiChu)
            VALUES (@MaKH, N'Cộng', N'Nhiệm vụ', @SoDiem, GETDATE(), @GhiChu)
        `);
};

// Tổng điểm hiện có của khách hàng
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

module.exports = {
    getMaKHByMaTK,
    getAllTasks,
    getClaimedToday,
    checkCondition,
    claimTask,
    getTotalPoints
};