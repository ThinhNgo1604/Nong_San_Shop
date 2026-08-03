const { connectDB, sql } = require("../config/db");

const getDashboardReport = async (from, to) => {

    const pool = await connectDB();

    const result = await pool.request()

        .input("From", sql.Date, from)
        .input("To", sql.Date, to)

        .query(`

            SELECT

                COUNT(*) TongDonHang,

                ISNULL(SUM(TongTien),0) TongDoanhThu

            FROM DonHang

            WHERE

                TrangThaiDonHang = N'Đã giao'

                AND CAST(NgayDat AS DATE)
                BETWEEN @From AND @To

        `);

    return result.recordset[0];

};

const getRevenueChart = async (from, to) => {

    const pool = await connectDB();

    const result = await pool.request()

        .input("From", sql.Date, from)
        .input("To", sql.Date, to)

        .query(`

            SELECT

                CONVERT(varchar,NgayDat,103) Ngay,

                SUM(TongTien) DoanhThu

            FROM DonHang

            WHERE

                TrangThaiDonHang=N'Đã giao'

                AND CAST(NgayDat AS DATE)
                BETWEEN @From AND @To

            GROUP BY CONVERT(varchar,NgayDat,103)

            ORDER BY MIN(NgayDat)

        `);

    return result.recordset;

};

const getTopProducts = async (from, to) => {

    const pool = await connectDB();

    const result = await pool.request()

        .input("from", sql.Date, from)

        .input("to", sql.Date, to)

        .query(`

        SELECT TOP 5

            sp.TenSP,

            SUM(ct.SoLuong) AS SoLuongBan

        FROM ChiTietDonHang ct

        JOIN DonHang dh

            ON ct.MaDH=dh.MaDH

        JOIN SanPham sp

            ON ct.MaSP=sp.MaSP

        WHERE

            dh.TrangThaiDonHang=N'Đã giao'

        AND

            CAST(dh.NgayDat AS DATE) BETWEEN @from AND @to

        GROUP BY

            sp.TenSP

        ORDER BY

            SoLuongBan DESC

        `);

    return result.recordset;

};

module.exports = {

    getDashboardReport,
    getRevenueChart,
    getTopProducts

};