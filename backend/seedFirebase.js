const bcrypt = require("bcryptjs");
const { db, collection, doc, setDoc, getDocs } = require("./firebase");

async function seedCompleteFirebaseData() {
    console.log("🔥 Đang kiểm tra và đẩy toàn bộ dữ liệu mẫu lên Firebase Firestore...");

    const hashedPasswordAdmin = bcrypt.hashSync("123456", 10);
    const hashedPasswordUser = bcrypt.hashSync("123456", 10);

    const initialData = {
        TaiKhoan: [
            {
                MaTK: 1,
                TenDangNhap: "admin",
                Email: "admin@gmail.com",
                MatKhau: hashedPasswordAdmin,
                SoDienThoai: "0123456789",
                VaiTro: "Admin",
                TrangThai: true,
                NgayTao: new Date().toISOString()
            },
            {
                MaTK: 2,
                TenDangNhap: "user",
                Email: "user@gmail.com",
                MatKhau: hashedPasswordUser,
                SoDienThoai: "0987654321",
                VaiTro: "KhachHang",
                TrangThai: true,
                NgayTao: new Date().toISOString()
            },
            {
                MaTK: 3,
                TenDangNhap: "nlhthinh95",
                Email: "nlhthinh95@gmail.com",
                MatKhau: hashedPasswordUser,
                SoDienThoai: "0912345678",
                VaiTro: "KhachHang",
                HoTen: "nlhthinh95",
                TrangThai: true,
                NgayTao: new Date().toISOString()
            }
        ],
        KhachHang: [
            {
                MaKH: 1,
                MaTK: 1,
                HoTen: "Quản Trị Viên",
                Email: "admin@gmail.com",
                SoDienThoai: "0123456789",
                DiaChi: "Hệ thống Nông Sản Shop",
                NgayTao: new Date().toISOString()
            },
            {
                MaKH: 2,
                MaTK: 2,
                HoTen: "Nguyễn Văn Khách",
                Email: "user@gmail.com",
                SoDienThoai: "0987654321",
                DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM",
                NgayTao: new Date().toISOString()
            },
            {
                MaKH: 3,
                MaTK: 3,
                HoTen: "nlhthinh95",
                Email: "nlhthinh95@gmail.com",
                SoDienThoai: "0912345678",
                DiaChi: "456 Nguyễn Thị Minh Khai, Q.3, TP.HCM",
                NgayTao: new Date().toISOString()
            }
        ],
        DanhMuc: [
            { MaDM: 1, TenDM: "Rau Củ Quả", MoTa: "Rau tươi ngon VietGAP", TrangThai: true },
            { MaDM: 2, TenDM: "Trái Cây Tươi", MoTa: "Trái cây ngọt lịm mọng nước", TrangThai: true },
            { MaDM: 3, TenDM: "Nông Sản Khô", MoTa: "Gạo, hạt, đậu các loại", TrangThai: true },
            { MaDM: 4, TenDM: "Thực Phẩm Chế Biến", MoTa: "Nước ép, mứt, nông sản sấy", TrangThai: true },
            { MaDM: 5, TenDM: "Đặc Sản Vùng Miền", MoTa: "Nông sản vùng miền độc đáo", TrangThai: true },
            { MaDM: 6, TenDM: "Hạt Giống", MoTa: "Hạt giống cây trồng tỉ lệ nảy mầm cao", TrangThai: true },
            { MaDM: 7, TenDM: "Sản Phẩm Hữu Cơ", MoTa: "Sản phẩm hữu cơ 100% chứng nhận", TrangThai: true },
            { MaDM: 8, TenDM: "Combo Tiết Kiệm", MoTa: "Gói gia đình tiết kiệm", TrangThai: true }
        ],
        SanPham: [
            { MaSP: 1, TenSP: "Táo Envy New Zealand", MaDM: 2, DonGia: 85000, GiaGoc: 95000, GiamToiDa: 30, TuDongGiamGia: 1, MoTa: "Táo Envy nhập khẩu New Zealand tươi giòn, ngọt đậm vị, giàu Vitamin C tốt cho sức khỏe.", HinhAnh: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop", SoLuongTon: 120, DonViTinh: "Kg", TrangThai: true, TenDM: "Trái Cây Tươi" },
            { MaSP: 2, TenSP: "Cam Sành Tiền Giang", MaDM: 2, DonGia: 38000, GiaGoc: 45000, GiamToiDa: 20, TuDongGiamGia: 1, MoTa: "Cam sành mọng nước, nhiều Vitamin C, ngọt thanh mỏng vỏ chuẩn miệt vườn Western.", HinhAnh: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&auto=format&fit=crop", SoLuongTon: 250, DonViTinh: "Kg", TrangThai: true, TenDM: "Trái Cây Tươi" },
            { MaSP: 3, TenSP: "Dâu Tây Đà Lạt Giống Mỹ", MaDM: 2, DonGia: 129000, GiaGoc: 150000, GiamToiDa: 25, TuDongGiamGia: 1, MoTa: "Dâu tây tươi hái tận vườn Đà Lạt mỗi sáng, thơm ngọt mọng nước đạt chuẩn VietGAP.", HinhAnh: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop", SoLuongTon: 85, DonViTinh: "Hộp 500g", TrangThai: true, TenDM: "Trái Cây Tươi" },
            { MaSP: 4, TenSP: "Cà Rốt Hữu Cơ VietGAP", MaDM: 1, DonGia: 28000, GiaGoc: 32000, GiamToiDa: 15, TuDongGiamGia: 1, MoTa: "Cà rốt hữu cơ củ to tròn, ngọt dịu, thích hợp làm nước ép, súp hầm bổ dưỡng.", HinhAnh: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=500&auto=format&fit=crop", SoLuongTon: 300, DonViTinh: "Kg", TrangThai: true, TenDM: "Rau Củ Quả" },
            { MaSP: 5, TenSP: "Gạo Lứt Tím ST25", MaDM: 3, DonGia: 55000, GiaGoc: 65000, GiamToiDa: 20, TuDongGiamGia: 1, MoTa: "Gạo lứt tím Sóc Trăng dẻo thơm hạt cơm đậm đà, hỗ trợ giữ dáng tốt cho tim mạch.", HinhAnh: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop", SoLuongTon: 500, DonViTinh: "Túi 2Kg", TrangThai: true, TenDM: "Nông Sản Khô" },
            { MaSP: 6, TenSP: "Bơ Sáp Đắk Lắk Loại 1", MaDM: 2, DonGia: 62000, GiaGoc: 75000, GiamToiDa: 20, TuDongGiamGia: 1, MoTa: "Bơ sáp Đắk Lắk dẻo quánh, béo ngậy, da xanh cơm vàng ươm hấp dẫn.", HinhAnh: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop", SoLuongTon: 110, DonViTinh: "Kg", TrangThai: true, TenDM: "Trái Cây Tươi" },
            { MaSP: 7, TenSP: "Nấm Đùi Gà Tươi Clean", MaDM: 1, DonGia: 42000, GiaGoc: 48000, GiamToiDa: 15, TuDongGiamGia: 1, MoTa: "Nấm đùi gà tươi giòn, ngọt thanh, dồi dào chất xơ đạm thực vật.", HinhAnh: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop", SoLuongTon: 90, DonViTinh: "Gói 300g", TrangThai: true, TenDM: "Rau Củ Quả" },
            { MaSP: 8, TenSP: "Dưa Hấu Hoàng Kim", MaDM: 2, DonGia: 42000, GiaGoc: 50000, GiamToiDa: 15, TuDongGiamGia: 1, MoTa: "Dưa hấu ruột đỏ vỏ vàng hoàng kim mọng nước, ngọt thanh mát lạnh.", HinhAnh: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500&auto=format&fit=crop", SoLuongTon: 150, DonViTinh: "Trái", TrangThai: true, TenDM: "Trái Cây Tươi" }
        ],
        Voucher: [
            { MaVoucher: 1, MaCode: "FREESHIP", TenVoucher: "Miễn phí vận chuyển", PhanTramGiam: 10, GiamToiDa: 30000, GiaTriToiThieu: 199000, SoLuong: 100, TrangThai: true },
            { MaVoucher: 2, MaCode: "NONGSAN10", TenVoucher: "Giảm 10% nông sản sạch", PhanTramGiam: 10, GiamToiDa: 50000, GiaTriToiThieu: 200000, SoLuong: 50, TrangThai: true },
            { MaVoucher: 3, MaCode: "TETHANHPHUC", TenVoucher: "Ưu đãi Tết Thanh Phúc 20k", PhanTramGiam: 15, GiamToiDa: 20000, GiaTriToiThieu: 150000, SoLuong: 80, TrangThai: true }
        ],
        DonHang: [
            { MaDH: 101, MaKH: 2, TenKhachHang: "Nguyễn Văn Khách", TenNguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", TongTien: 212000, TrangThai: "Đã giao", NgayTao: new Date(Date.now() - 86400000 * 3).toISOString() },
            { MaDH: 102, MaKH: 3, TenKhachHang: "nlhthinh95", TenNguoiNhan: "nlhthinh95", SoDienThoai: "0912345678", DiaChi: "123 Nguyễn Văn Linh, Q.7, TP.HCM", TongTien: 125000, TrangThai: "Chờ xác nhận", NgayTao: new Date().toISOString() },
            { MaDH: 106, MaKH: 3, TenKhachHang: "nlhthinh95", TenNguoiNhan: "nlhthinh95", SoDienThoai: "0912345678", DiaChi: "456 Nguyễn Thị Minh Khai, Q.3, TP.HCM", TongTien: 310000, TrangThai: "Đã xác nhận", NgayTao: new Date(Date.now() - 3600000).toISOString() }
        ],
        ChiTietDonHang: [
            { MaDH: 101, MaSP: 1, TenSP: "Táo Envy New Zealand", SoLuong: 2, DonGia: 85000, ThanhTien: 170000 },
            { MaDH: 102, MaSP: 3, TenSP: "Dâu Tây Đà Lạt Giống Mỹ", SoLuong: 1, DonGia: 129000, ThanhTien: 129000 },
            { MaDH: 106, MaSP: 1, TenSP: "Táo Envy New Zealand", SoLuong: 2, DonGia: 85000, ThanhTien: 170000 },
            { MaDH: 106, MaSP: 2, TenSP: "Cam Sành Tiền Giang", SoLuong: 3, DonGia: 38000, ThanhTien: 114000 }
        ],
        ThongBao: [
            { MaTB: 1, MaKH: 2, TieuDe: "Đơn hàng đã được giao thành công", NoiDung: "Đơn hàng #101 của bạn đã giao hoàn tất. Cảm ơn bạn đã mua hàng tại Nông Sản Shop!", DaDoc: false, NgayTao: new Date().toISOString() }
        ],
        DiaChi: [
            { MaDC: 1, MaTK: 2, TenNguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", MacDinh: true }
        ],
        DanhGia: [
            { MaDG: 1, MaKH: 2, MaSP: 1, SoSao: 5, NoiDung: "Táo rất tươi ngon, giòn ngọt, đóng gói cẩn thận!", NgayDG: new Date(Date.now() - 86400000 * 2).toISOString() },
            { MaDG: 2, MaKH: 2, MaSP: 3, SoSao: 5, NoiDung: "Dâu tây mọng nước, giao hàng nhanh.", NgayDG: new Date(Date.now() - 86400000).toISOString() }
        ]
    };

    function getDocId(tableName, item) {
        if (!item) return String(Math.random());
        if (tableName === 'DanhGia' && item.MaDG) return String(item.MaDG);
        if (tableName === 'TaiKhoan' && item.MaTK) return String(item.MaTK);
        if (tableName === 'KhachHang' && item.MaKH) return String(item.MaKH);
        if (tableName === 'DanhMuc' && item.MaDM) return String(item.MaDM);
        if (tableName === 'SanPham' && item.MaSP) return String(item.MaSP);
        if (tableName === 'Voucher' && (item.MaVoucher || item.MaGG)) return String(item.MaVoucher || item.MaGG);
        if (tableName === 'DonHang' && item.MaDH) return String(item.MaDH);
        if (tableName === 'ChiTietDonHang' && item.MaDH && item.MaSP) return `${item.MaDH}_${item.MaSP}`;
        if (tableName === 'ThongBao' && item.MaTB) return String(item.MaTB);
        if (tableName === 'DiaChi' && item.MaDC) return String(item.MaDC);
        if (item.MaDG) return String(item.MaDG);
        if (item.MaDH) return String(item.MaDH);
        if (item.MaSP) return String(item.MaSP);
        if (item.MaTK) return String(item.MaTK);
        if (item.MaKH) return String(item.MaKH);
        return String(Math.random());
    }

    for (const [tableName, records] of Object.entries(initialData)) {
        console.log(`📡 Đang đẩy bảng [${tableName}] (${records.length} bản ghi)...`);
        for (const item of records) {
            const docId = getDocId(tableName, item);
            await setDoc(doc(db, tableName, docId), item, { merge: true });
        }
    }

    console.log("🎉 ĐÃ ĐẨY TOÀN BỘ DỮ LIỆU LÊN FIREBASE FIRESTORE THÀNH CÔNG!");
}

if (require.main === module) {
    seedCompleteFirebaseData().then(() => process.exit(0)).catch(err => {
        console.error("Lỗi:", err);
        process.exit(1);
    });
}

module.exports = seedCompleteFirebaseData;
