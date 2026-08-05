const { connectDB, sql } = require("../config/db");

// Kiểm tra email hoặc tên đăng nhập đã tồn tại chưa
const findByEmail = async (email) => {
    const pool = await connectDB();

    const result = await pool
        .request()
        .input("Email", sql.VarChar, email)
        .query(`
            SELECT tk.MaTK, tk.TenDangNhap, tk.Email, tk.SoDienThoai, tk.VaiTro, tk.TrangThai, tk.MatKhau,
                   ISNULL(NULLIF(tk.HinhAnh, ''), kh.HinhAnh) AS HinhAnh,
                   ISNULL(NULLIF(kh.HinhAnh, ''), tk.HinhAnh) AS AvatarKhachHang,
                   ISNULL(NULLIF(kh.HoTen, ''), tk.TenDangNhap) AS HoTen,
                   kh.GioiTinh, kh.NgaySinh
            FROM TaiKhoan tk
            LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
            WHERE tk.Email = @Email OR tk.TenDangNhap = @Email
        `);

    return result.recordset[0];
};

// Tìm tài khoản theo mã tài khoản
const findById = async (maTK) => {
    const pool = await connectDB();

    const result = await pool
        .request()
        .input("MaTK", sql.Int, maTK)
        .query(`
            SELECT tk.MaTK, tk.TenDangNhap, tk.Email, tk.SoDienThoai, tk.VaiTro, tk.TrangThai, tk.MatKhau,
                   ISNULL(NULLIF(tk.HinhAnh, ''), kh.HinhAnh) AS HinhAnh,
                   ISNULL(NULLIF(kh.HinhAnh, ''), tk.HinhAnh) AS AvatarKhachHang,
                   ISNULL(NULLIF(kh.HoTen, ''), tk.TenDangNhap) AS HoTen,
                   kh.GioiTinh, kh.NgaySinh
            FROM TaiKhoan tk
            LEFT JOIN KhachHang kh ON tk.MaTK = kh.MaTK
            WHERE tk.MaTK = @MaTK
        `);

    return result.recordset[0];
};

// Tạo tài khoản mới
const createTaiKhoan = async (tenDangNhap, matKhau, email, soDienThoai) => {
    const pool = await connectDB();

    const result = await pool
        .request()
        .input("TenDangNhap", sql.VarChar, tenDangNhap)
        .input("MatKhau", sql.VarChar, matKhau)
        .input("Email", sql.VarChar, email)
        .input("SoDienThoai", sql.VarChar, soDienThoai)
        .input("VaiTro", sql.NVarChar, "Khách hàng")
        .query(`
            INSERT INTO TaiKhoan 
            (TenDangNhap, MatKhau, Email, SoDienThoai, VaiTro)
            OUTPUT INSERTED.MaTK
            VALUES (@TenDangNhap, @MatKhau, @Email, @SoDienThoai, @VaiTro)
        `);

    return result.recordset[0].MaTK;
};

// Tạo hồ sơ khách hàng liên kết với tài khoản
const createKhachHang = async (maTK, hoTen) => {
    const pool = await connectDB();

    await pool
        .request()
        .input("MaTK", sql.Int, maTK)
        .input("HoTen", sql.NVarChar, hoTen)
        .query(`
            INSERT INTO KhachHang (MaTK, HoTen)
            VALUES (@MaTK, @HoTen)
        `);
};

// Tạo tài khoản Admin
const createAdmin = async (tenDangNhap, matKhau, email, soDienThoai) => {
    const pool = await connectDB();

    const result = await pool
        .request()
        .input("TenDangNhap", sql.VarChar, tenDangNhap)
        .input("MatKhau", sql.VarChar, matKhau)
        .input("Email", sql.VarChar, email)
        .input("SoDienThoai", sql.VarChar, soDienThoai)
        .input("VaiTro", sql.NVarChar, "Admin")
        .query(`
            INSERT INTO TaiKhoan 
            (TenDangNhap, MatKhau, Email, SoDienThoai, VaiTro)
            OUTPUT INSERTED.MaTK
            VALUES (@TenDangNhap, @MatKhau, @Email, @SoDienThoai, @VaiTro)
        `);

    return result.recordset[0].MaTK;
};

// Cập nhật mật khẩu
const updatePassword = async (maTK, hashedPassword) => {
    const pool = await connectDB();

    await pool
        .request()
        .input("MaTK", sql.Int, maTK)
        .input("MatKhau", sql.VarChar, hashedPassword)
        .query(`
            UPDATE TaiKhoan
            SET MatKhau = @MatKhau
            WHERE MaTK = @MaTK
        `);
};

// Cập nhật hồ sơ cá nhân
const updateProfile = async (maTK, { hoTen, soDienThoai, gioiTinh, ngaySinh, avatarUrl }) => {
    const pool = await connectDB();

    const validAvatar = (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') ? avatarUrl.trim() : null;

    // Cập nhật số điện thoại và hình ảnh ở bảng TaiKhoan
    await pool
        .request()
        .input("MaTK", sql.Int, maTK)
        .input("HoTen", sql.NVarChar, hoTen || null)
        .input("SoDienThoai", sql.VarChar, soDienThoai || null)
        .input("GioiTinh", sql.NVarChar, gioiTinh || null)
        .input("NgaySinh", sql.Date, ngaySinh || null)
        .input("HinhAnh", sql.NVarChar, validAvatar)
        .query(`
            UPDATE TaiKhoan
            SET SoDienThoai = ISNULL(@SoDienThoai, SoDienThoai),
                HinhAnh = ISNULL(@HinhAnh, HinhAnh)
            WHERE MaTK = @MaTK
        `);

    // Cập nhật thông tin ở bảng KhachHang
    await pool
        .request()
        .input("MaTK", sql.Int, maTK)
        .input("HoTen", sql.NVarChar, hoTen || null)
        .input("SoDienThoai", sql.VarChar, soDienThoai || null)
        .input("GioiTinh", sql.NVarChar, gioiTinh || null)
        .input("NgaySinh", sql.Date, ngaySinh || null)
        .input("HinhAnh", sql.NVarChar, validAvatar)
        .query(`
            UPDATE KhachHang
            SET HoTen = ISNULL(@HoTen, HoTen),
                SoDienThoai = ISNULL(@SoDienThoai, SoDienThoai),
                GioiTinh = ISNULL(@GioiTinh, GioiTinh),
                NgaySinh = ISNULL(@NgaySinh, NgaySinh),
                HinhAnh = ISNULL(@HinhAnh, HinhAnh)
            WHERE MaTK = @MaTK
        `);
};

module.exports = {
    findByEmail,
    findById,
    createTaiKhoan,
    createKhachHang,
    createAdmin,
    updatePassword,
    updateProfile,
};