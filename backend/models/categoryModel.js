const { connectDB, sql } = require("../config/db");

const checkCategoryName = async (TenDM) => {

    const pool = await connectDB();

    const result = await pool.request()
        .input("TenDM", sql.NVarChar, TenDM)
        .query(`
            SELECT *
            FROM DanhMuc
            WHERE TenDM = @TenDM
        `);

    return result.recordset.length > 0;
};
const checkCategoryNameUpdate = async (MaDM, TenDM) => {

    const pool = await connectDB();

    const result = await pool.request()
        .input("MaDM", sql.Int, MaDM)
        .input("TenDM", sql.NVarChar, TenDM)
        .query(`
            SELECT *
            FROM DanhMuc
            WHERE TenDM = @TenDM
            AND MaDM <> @MaDM
        `);

    return result.recordset.length > 0;
};
// Lấy tất cả danh mục
const getAllCategories = async () => {

    const pool = await connectDB();

    const result = await pool.request().query(`
        SELECT MaDM, TenDM, MoTa
        FROM DanhMuc
        ORDER BY MaDM
    `);

    return result.recordset;
};

// Thêm danh mục
const createCategory = async (category) => {

    const pool = await connectDB();

    await pool.request()
        .input("TenDM", sql.NVarChar, category.TenDM)
        .input("MoTa", sql.NVarChar, category.MoTa)
        .query(`
            INSERT INTO DanhMuc(TenDM, MoTa)
            VALUES(@TenDM, @MoTa)
        `);

};

// Cập nhật danh mục
const updateCategory = async (id, category) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaDM", sql.Int, id)
        .input("TenDM", sql.NVarChar, category.TenDM)
        .input("MoTa", sql.NVarChar, category.MoTa)
        .query(`
            UPDATE DanhMuc
            SET
                TenDM = @TenDM,
                MoTa = @MoTa
            WHERE MaDM = @MaDM
        `);

};
// Xóa danh mục
const deleteCategory = async (id) => {

    const pool = await connectDB();

    await pool.request()
        .input("MaDM", sql.Int, id)
        .query(`
            DELETE FROM DanhMuc
            WHERE MaDM = @MaDM
        `);

};

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    checkCategoryName,
    checkCategoryNameUpdate
};