const { connectDB, sql } = require("../config/db");
const calculatePrice = require("../utils/priceCalculator");
const checkProductName = async (TenSP) => {

    const pool = await connectDB();

    const result = await pool.request()
        .input("TenSP", sql.NVarChar, TenSP)
        .query(`
            SELECT 1
            FROM SanPham
            WHERE TenSP = @TenSP
        `);

    return result.recordset.length > 0;
};


const checkCategoryExists = async (MaDM) => {

    const pool = await connectDB();

    const result = await pool.request()
        .input("MaDM", sql.Int, MaDM)
        .query(`
            SELECT 1
            FROM DanhMuc
            WHERE MaDM = @MaDM
        `);

    return result.recordset.length > 0;
};

const getAllProducts = async (page, limit) => {

    const pool = await connectDB();
    const offset = (page - 1) * limit;

    const totalResult = await pool.request().query(`
        SELECT COUNT(*) AS Total
        FROM SanPham
        WHERE TrangThai=1
        `);

    const total = totalResult.recordset[0].Total;

    const result = await pool.request()
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit)
    .query(`
        SELECT
            sp.MaSP,
            sp.TenSP,
            sp.MaDM,
            sp.DonGia,
            sp.GiaGoc,          -- Thêm dòng này
            sp.GiamToiDa,       -- Thêm dòng này
            sp.TuDongGiamGia,   -- Thêm dòng này
            sp.MoTa,
            sp.HinhAnh,
            sp.SoLuongTon,
            sp.DonViTinh,
            sp.TrangThai,
            dm.TenDM
        FROM SanPham sp
        INNER JOIN DanhMuc dm
        ON sp.MaDM = dm.MaDM
        WHERE sp.TrangThai = 1
        ORDER BY sp.MaSP DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY 
        `);
    return {

        products: result.recordset,

        total,

        page,

        totalPages: Math.ceil(total/limit)

    };
};
const getAllProductsClient = async () => {

    const pool = await connectDB();

    const result = await pool.request().query(`
        SELECT
            sp.MaSP,
            sp.MaDM,
            sp.TenSP,
            sp.DonGia,
            sp.GiaGoc,          -- Thêm dòng này
            sp.GiamToiDa,       -- Thêm dòng này
            sp.TuDongGiamGia,   -- Thêm dòng này
            sp.MoTa,
            sp.HinhAnh,
            sp.SoLuongTon,
            sp.DonViTinh,
            dm.TenDM
        FROM SanPham sp
        INNER JOIN DanhMuc dm
            ON sp.MaDM = dm.MaDM
        WHERE sp.TrangThai = 1
        ORDER BY sp.MaSP DESC
    `);

    return result.recordset;

};

const filterProductsByPrice = async (minPrice, maxPrice) => {
    const pool = await connectDB();
    const request = pool.request();
    let query = `
        SELECT
            sp.MaSP,
            sp.MaDM,
            sp.TenSP,
            sp.DonGia,
            sp.GiaGoc,          -- Thêm dòng này
            sp.GiamToiDa,       -- Thêm dòng này
            sp.TuDongGiamGia,   -- Thêm dòng này
            sp.MoTa,
            sp.HinhAnh,
            sp.SoLuongTon,
            sp.DonViTinh,
            dm.TenDM
        FROM SanPham sp
        INNER JOIN DanhMuc dm ON sp.MaDM = dm.MaDM
        WHERE sp.TrangThai = 1
    `;

    // Thêm điều kiện lọc giá tối thiểu
    if (minPrice !== null && !isNaN(minPrice)) {
        query += ` AND sp.DonGia >= @minPrice`;
        request.input("minPrice", sql.Decimal(18, 2), minPrice);
    }

    // Thêm điều kiện lọc giá tối đa
    if (maxPrice !== null && !isNaN(maxPrice)) {
        query += ` AND sp.DonGia <= @maxPrice`;
        request.input("maxPrice", sql.Decimal(18, 2), maxPrice);
    }
    
    query += ` ORDER BY sp.MaSP DESC`;

    const result = await request.query(query);
    return result.recordset;
};

const getById = async (id) => {
    const pool = await connectDB();
    const result = await pool.request()
        .input('MaSP', sql.Int, id)
        .query(`SELECT * FROM SanPham WHERE MaSP = @MaSP`);
    return result.recordset[0];
};

// Thêm sản phẩm
const createProduct = async (product) => {
    const pool = await connectDB();
    
    // Xử lý logic boolean cho TuDongGiamGia (vì FormData đôi khi gửi dạng chuỗi 'true'/'false')
    const isAutoDiscount = product.TuDongGiamGia === 'false' || product.TuDongGiamGia === false ? 0 : 1;

    await pool.request()
        .input("TenSP", sql.NVarChar, product.TenSP)
        .input("MaDM", sql.Int, product.MaDM)
        .input("DonGia", sql.Decimal(18,2), product.GiaGoc) // Lưu tạm GiaGoc vào DonGia để thỏa mãn NOT NULL
        .input("GiaGoc", sql.Decimal(18,2), product.GiaGoc)
        .input("GiamToiDa", sql.Int, product.GiamToiDa || 30)
        .input("TuDongGiamGia", sql.Bit, isAutoDiscount)
        .input("MoTa", sql.NVarChar, product.MoTa)
        .input("HinhAnh", sql.NVarChar, product.HinhAnh)
        .input("SoLuongTon", sql.Int, product.SoLuongTon)
        .input("DonViTinh", sql.NVarChar, product.DonViTinh)
        .input("TrangThai", sql.Bit, product.TrangThai)
        .query(`
            INSERT INTO SanPham
            (
                TenSP, MaDM, DonGia, GiaGoc, GiamToiDa, TuDongGiamGia, 
                MoTa, HinhAnh, SoLuongTon, DonViTinh, TrangThai
            )
            VALUES
            (
                @TenSP, @MaDM, @DonGia, @GiaGoc, @GiamToiDa, @TuDongGiamGia, 
                @MoTa, @HinhAnh, @SoLuongTon, @DonViTinh, @TrangThai
            )
        `);
};

const updateProduct = async (id, product) => {
    const pool = await connectDB();
    
    const isAutoDiscount = product.TuDongGiamGia === 'false' || product.TuDongGiamGia === false ? 0 : 1;

    let query = `
        UPDATE SanPham
        SET
            TenSP = @TenSP,
            MaDM = @MaDM,
            DonGia = @DonGia, 
            GiaGoc = @GiaGoc,
            GiamToiDa = @GiamToiDa,
            TuDongGiamGia = @TuDongGiamGia,
            MoTa = @MoTa,
            SoLuongTon = @SoLuongTon,
            DonViTinh = @DonViTinh,
            TrangThai = @TrangThai
    `;

    const request = pool.request()
        .input("TenSP", sql.NVarChar, product.TenSP)
        .input("MaDM", sql.Int, product.MaDM)
        .input("DonGia", sql.Decimal(18,2), product.GiaGoc)
        .input("GiaGoc", sql.Decimal(18,2), product.GiaGoc)
        .input("GiamToiDa", sql.Int, product.GiamToiDa || 30)
        .input("TuDongGiamGia", sql.Bit, isAutoDiscount)
        .input("MoTa", sql.NVarChar, product.MoTa)
        .input("SoLuongTon", sql.Int, product.SoLuongTon)
        .input("DonViTinh", sql.NVarChar, product.DonViTinh)
        .input("TrangThai", sql.Bit, product.TrangThai)
        .input("MaSP", sql.Int, id);

    // Chỉ cập nhật ảnh nếu người dùng chọn ảnh mới
    if(product.HinhAnh){
        query += `, HinhAnh=@HinhAnh`;
        request.input("HinhAnh", sql.NVarChar, product.HinhAnh);
    }

    query += ` WHERE MaSP=@MaSP`;

    await request.query(query);
};

const deleteProduct = async (id) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaSP", sql.Int, id)
        .query(`
            UPDATE SanPham
            SET TrangThai = 0
            WHERE MaSP = @MaSP
        `);

};

// Tìm sản phẩm liên quan theo từ khóa - dùng cho Chatbot tư vấn
const searchProducts = async (keyword, limit = 5) => {

    const pool = await connectDB();

    const words = keyword.split(/\s+/).filter(w => w.length > 1);

    if (words.length === 0) return [];

    const request = pool.request().input("limit", sql.Int, limit);

    const conditions = words.map((word, i) => {
        const paramName = `kw${i}`;
        request.input(paramName, sql.NVarChar, `%${word}%`);
        return `(sp.TenSP LIKE @${paramName} OR sp.MoTa LIKE @${paramName} OR dm.TenDM LIKE @${paramName})`;
    }).join(" OR ");

    const result = await request.query(`
        SELECT TOP (@limit)
            sp.MaSP,
            sp.TenSP,
            sp.DonGia,
            sp.GiaGoc,          -- Thêm dòng này
            sp.GiamToiDa,       -- Thêm dòng này
            sp.TuDongGiamGia,   -- Thêm dòng này
            sp.MoTa,
            sp.SoLuongTon,
            sp.DonViTinh,
            dm.TenDM
        FROM SanPham sp
        INNER JOIN DanhMuc dm
            ON sp.MaDM = dm.MaDM
        WHERE sp.TrangThai = 1 
          AND (${conditions})
        ORDER BY sp.MaSP DESC
    `);

    return result.recordset;
};
const getAllPrices = async () => {

    const pool = await connectDB();

    const result = await pool.request().query(`
        SELECT
            MaSP,
            TenSP,
            GiaGoc,
            DonGia,
            GiamToiDa,
            TuDongGiamGia
        FROM SanPham
        WHERE TrangThai = 1
        ORDER BY MaSP DESC
    `);

    return result.recordset;
};

const updatePrice = async (id, data) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaSP", sql.Int, id)
        .input("GiaGoc", sql.Decimal(18,2), data.GiaGoc)
        .input("GiamToiDa", sql.Int, data.GiamToiDa)
        .input("TuDongGiamGia", sql.Bit, data.TuDongGiamGia)
        .query(`
            UPDATE SanPham
            SET
                GiaGoc = @GiaGoc,
                GiamToiDa = @GiamToiDa,
                TuDongGiamGia = @TuDongGiamGia
            WHERE MaSP=@MaSP
        `);

};
module.exports = {
    getAllProducts,
    getAllProductsClient,
    getById,
    filterProductsByPrice,
    createProduct,
    updateProduct,
    deleteProduct,
    checkProductName,
    checkCategoryExists,
    searchProducts,
    getAllPrices,
    updatePrice
};