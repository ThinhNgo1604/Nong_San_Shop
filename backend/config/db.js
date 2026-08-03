const sql = require("mssql");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { db, collection, getDocs, doc, setDoc, deleteDoc } = require("../firebase");

const config = {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "",
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_DATABASE || "NongSanShopDB",
    port: Number(process.env.DB_PORT) || 1433,
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    }
};

let poolPromise = null;

// ================= Mock DB In-Memory Engine + Firebase Firestore =================
const defaultHashedPassword = bcrypt.hashSync("123456", 10);

const mockStore = {
    TaiKhoan: [
        { MaTK: 1, TenDangNhap: "admin", Email: "admin@gmail.com", MatKhau: defaultHashedPassword, SoDienThoai: "0901234567", VaiTro: "Admin", TrangThai: true },
        { MaTK: 2, TenDangNhap: "user", Email: "user@gmail.com", MatKhau: defaultHashedPassword, SoDienThoai: "0987654321", VaiTro: "KhachHang", TrangThai: true }
    ],
    KhachHang: [
        { MaKH: 2, HoTen: "Nguyễn Văn Khách", Email: "user@gmail.com", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", NgayTao: new Date().toISOString() }
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
        { MaSP: 5, TenSP: "Gạo Lứt Tím ST25", MaDM: 3, DonGia: 55000, GiaGoc: 65000, GiamToiDa: 20, TuDongGiamGia: 1, MoTa: "Gạo lứt tím Soc Trăng dẻo thơm hạt cơm đậm đà, hỗ trợ giữ dáng tốt cho tim mạch.", HinhAnh: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop", SoLuongTon: 500, DonViTinh: "Túi 2Kg", TrangThai: true, TenDM: "Nông Sản Khô" },
        { MaSP: 6, TenSP: "Bơ Sáp Đắk Lắk Loại 1", MaDM: 2, DonGia: 62000, GiaGoc: 75000, GiamToiDa: 20, TuDongGiamGia: 1, MoTa: "Bơ sáp Đắk Lắk dẻo quánh, béo ngậy, da xanh cơm vàng ươm hấp dẫn.", HinhAnh: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop", SoLuongTon: 110, DonViTinh: "Kg", TrangThai: true, TenDM: "Trái Cây Tươi" },
        { MaSP: 7, TenSP: "Nấm Đùi Gà Tươi Clean", MaDM: 1, DonGia: 42000, GiaGoc: 48000, GiamToiDa: 15, TuDongGiamGia: 1, MoTa: "Nấm đùi gà tươi giòn, ngọt thanh naturally, dồi dào chất xơ đạm thực vật.", HinhAnh: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop", SoLuongTon: 90, DonViTinh: "Gói 300g", TrangThai: true, TenDM: "Rau Củ Quả" },
        { MaSP: 8, TenSP: "Dưa Hấu Hoàng Kim", MaDM: 2, DonGia: 42000, GiaGoc: 50000, GiamToiDa: 15, TuDongGiamGia: 1, MoTa: "Dưa hấu ruột đỏ vỏ vàng hoàng kim mọng nước, ngọt thanh mát lạnh.", HinhAnh: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500&auto=format&fit=crop", SoLuongTon: 150, DonViTinh: "Trái", TrangThai: true, TenDM: "Trái Cây Tươi" }
    ],
    Voucher: [
        { MaVoucher: 1, MaCode: "FREESHIP", TenVoucher: "Miễn phí vận chuyển", PhanTramGiam: 10, GiamToiDa: 30000, GiaTriToiThieu: 199000, SoLuong: 100, TrangThai: true },
        { MaVoucher: 2, MaCode: "NONGSAN10", TenVoucher: "Giảm 10% nông sản sạch", PhanTramGiam: 10, GiamToiDa: 50000, GiaTriToiThieu: 200000, SoLuong: 50, TrangThai: true },
        { MaVoucher: 3, MaCode: "TETHANHPHUC", TenVoucher: "Ưu đãi Tết Thanh Phúc 20k", PhanTramGiam: 15, GiamToiDa: 20000, GiaTriToiThieu: 150000, SoLuong: 80, TrangThai: true }
    ],
    DonHang: [
        { MaDH: 101, MaKH: 2, TenNguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", TongTien: 212000, TrangThai: "Đã giao", NgayTao: new Date().toISOString() },
        { MaDH: 102, MaKH: 2, TenNguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", TongTien: 125000, TrangThai: "Đang xử lý", NgayTao: new Date().toISOString() }
    ],
    ChiTietDonHang: [
        { MaDH: 101, MaSP: 1, TenSP: "Táo Envy New Zealand", SoLuong: 2, DonGia: 85000, ThanhTien: 170000 },
        { MaDH: 101, MaSP: 8, TenSP: "Dưa Hấu Hoàng Kim", SoLuong: 1, DonGia: 42000, ThanhTien: 42000 },
        { MaDH: 102, MaSP: 3, TenSP: "Dâu Tây Đà Lạt Giống Mỹ", SoLuong: 1, DonGia: 129000, ThanhTien: 129000 }
    ],
    ThongBao: [
        { MaTB: 1, MaKH: 2, TieuDe: "Đơn hàng đã được giao thành công", NoiDung: "Đơn hàng #101 của bạn đã giao hoàn tất. Cảm ơn bạn đã mua hàng tại Nông Sản Shop!", DaDoc: false, NgayTao: new Date().toISOString() }
    ],
    DanhGia: [],
    DiaChi: []
};

// Hàm đồng bộ Firebase Firestore
async function syncFirebaseWithStore() {
    try {
        console.log("🔥 Kết nối và đồng bộ dữ liệu với Firebase Firestore...");
        const tables = ["TaiKhoan", "KhachHang", "DanhMuc", "SanPham", "Voucher", "DonHang", "ChiTietDonHang", "ThongBao", "DanhGia", "DiaChi"];
        
        for (const tableName of tables) {
            const snap = await getDocs(collection(db, tableName));
            if (snap.empty) {
                // Nếu Firestore trống, khởi tạo dữ liệu mẫu lên Firestore
                if (mockStore[tableName] && mockStore[tableName].length > 0) {
                    console.log(`🔥 Đang khởi tạo bảng ${tableName} lên Firebase Firestore...`);
                    for (const item of mockStore[tableName]) {
                        const idKey = item.MaTK ? 'MaTK' : item.MaSP ? 'MaSP' : item.MaDM ? 'MaDM' : item.MaVoucher ? 'MaVoucher' : item.MaDH ? 'MaDH' : item.MaKH ? 'MaKH' : item.MaTB ? 'MaTB' : item.MaDG ? 'MaDG' : item.MaDC ? 'MaDC' : null;
                        const docId = idKey && item[idKey] ? String(item[idKey]) : (item.id || String(Math.random()));
                        await setDoc(doc(db, tableName, docId), JSON.parse(JSON.stringify(item)));
                    }
                }
            } else {
                // Nếu trên Firestore đã có dữ liệu, load về mockStore
                const list = [];
                snap.forEach(docSnap => {
                    list.push(docSnap.data());
                });
                if (list.length > 0) {
                    mockStore[tableName] = list;
                }
            }
        }
        console.log("✅ Đồng bộ Firebase Firestore hoàn tất thành công!");
    } catch (err) {
        console.warn("⚠️ Lưu ý đồng bộ Firebase (vẫn chạy offline được):", err.message);
    }
}

// Lưu 1 item lên Firebase
async function syncDocToFirebase(tableName, item) {
    try {
        const idKey = item.MaTK ? 'MaTK' : item.MaSP ? 'MaSP' : item.MaDM ? 'MaDM' : item.MaVoucher ? 'MaVoucher' : item.MaDH ? 'MaDH' : item.MaKH ? 'MaKH' : item.MaTB ? 'MaTB' : item.MaDG ? 'MaDG' : item.MaDC ? 'MaDC' : null;
        const docId = idKey && item[idKey] ? String(item[idKey]) : (item.id || String(Math.random()));
        await setDoc(doc(db, tableName, docId), JSON.parse(JSON.stringify(item)), { merge: true });
    } catch (err) {
        console.error(`Error syncing ${tableName} to Firebase:`, err.message);
    }
}

function createMockPool() {
    return {
        request() {
            const inputs = {};
            const reqObj = {
                input(name, type, val) {
                    inputs[name] = val;
                    return reqObj;
                },
                async query(queryString) {
                    const q = queryString.trim().toUpperCase();

                    // --- SELECT TAIKHOAN ---
                    if (q.includes("FROM TAIKHOAN")) {
                        let list = [...mockStore.TaiKhoan];
                        if (inputs.Email) list = list.filter(u => u.Email && u.Email.toLowerCase() === String(inputs.Email).toLowerCase());
                        if (inputs.TenDangNhap) list = list.filter(u => u.TenDangNhap && u.TenDangNhap.toLowerCase() === String(inputs.TenDangNhap).toLowerCase());
                        if (inputs.MaTK) list = list.filter(u => u.MaTK === Number(inputs.MaTK));
                        return { recordset: list };
                    }

                    // --- INSERT TAIKHOAN ---
                    if (q.includes("INSERT INTO TAIKHOAN")) {
                        const newId = mockStore.TaiKhoan.length + 1;
                        const newUser = {
                            MaTK: newId,
                            TenDangNhap: inputs.TenDangNhap || inputs.Email,
                            MatKhau: inputs.MatKhau,
                            Email: inputs.Email,
                            SoDienThoai: inputs.SoDienThoai || "",
                            VaiTro: inputs.VaiTro || "KhachHang",
                            TrangThai: true
                        };
                        mockStore.TaiKhoan.push(newUser);
                        syncDocToFirebase("TaiKhoan", newUser);

                        const newKh = {
                            MaKH: newId,
                            HoTen: inputs.HoTen || inputs.TenDangNhap || "Khách Hàng",
                            Email: inputs.Email,
                            SoDienThoai: inputs.SoDienThoai || "",
                            DiaChi: "",
                            NgayTao: new Date().toISOString()
                        };
                        mockStore.KhachHang.push(newKh);
                        syncDocToFirebase("KhachHang", newKh);

                        return { recordset: [newUser] };
                    }

                    // --- SELECT DANHMUC ---
                    if (q.includes("FROM DANHMUC")) {
                        let list = mockStore.DanhMuc.filter(d => d.TrangThai);
                        if (inputs.MaDM) list = list.filter(d => d.MaDM === Number(inputs.MaDM));
                        return { recordset: list };
                    }

                    // --- SELECT SANPHAM ---
                    if (q.includes("FROM SANPHAM")) {
                        let list = mockStore.SanPham.filter(s => s.TrangThai);
                        if (inputs.MaSP) list = list.filter(s => s.MaSP === Number(inputs.MaSP));
                        if (inputs.MaDM) list = list.filter(s => s.MaDM === Number(inputs.MaDM));
                        if (inputs.minPrice) list = list.filter(s => s.DonGia >= Number(inputs.minPrice));
                        if (inputs.maxPrice) list = list.filter(s => s.DonGia <= Number(inputs.maxPrice));
                        
                        if (q.includes("COUNT(*) AS TOTAL")) {
                            return { recordset: [{ Total: list.length }] };
                        }
                        
                        return { recordset: list };
                    }

                    // --- INSERT / UPDATE SANPHAM ---
                    if (q.includes("INSERT INTO SANPHAM")) {
                        const newSp = {
                            MaSP: mockStore.SanPham.length + 1,
                            TenSP: inputs.TenSP,
                            MaDM: inputs.MaDM,
                            DonGia: inputs.GiaGoc || inputs.DonGia,
                            GiaGoc: inputs.GiaGoc || inputs.DonGia,
                            GiamToiDa: inputs.GiamToiDa || 30,
                            TuDongGiamGia: inputs.TuDongGiamGia ? 1 : 0,
                            MoTa: inputs.MoTa || "",
                            HinhAnh: inputs.HinhAnh || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop",
                            SoLuongTon: inputs.SoLuongTon || 50,
                            DonViTinh: inputs.DonViTinh || "Kg",
                            TrangThai: true,
                            TenDM: (mockStore.DanhMuc.find(d => d.MaDM === Number(inputs.MaDM)) || {}).TenDM || "Nông Sản"
                        };
                        mockStore.SanPham.unshift(newSp);
                        syncDocToFirebase("SanPham", newSp);
                        return { recordset: [newSp] };
                    }

                    // --- SELECT VOUCHER ---
                    if (q.includes("FROM VOUCHER") || q.includes("FROM KHUYENMAI")) {
                        return { recordset: mockStore.Voucher };
                    }

                    // --- SELECT KHACHHANG ---
                    if (q.includes("FROM KHACHHANG")) {
                        return { recordset: mockStore.KhachHang };
                    }

                    // --- SELECT DONHANG ---
                    if (q.includes("FROM DONHANG")) {
                        let list = [...mockStore.DonHang];
                        if (inputs.MaKH) list = list.filter(d => d.MaKH === Number(inputs.MaKH));
                        return { recordset: list };
                    }

                    // --- SELECT THONGBAO ---
                    if (q.includes("FROM THONGBAO")) {
                        let list = [...mockStore.ThongBao];
                        if (inputs.MaKH) list = list.filter(t => t.MaKH === Number(inputs.MaKH));
                        return { recordset: list };
                    }

                    // --- DEFAULT FALLBACK FOR ANY QUERY ---
                    return { recordset: [] };
                }
            };
            return reqObj;
        }
    };
}

let syncInitiated = false;

function connectDB() {
    if (!syncInitiated) {
        syncInitiated = true;
        syncFirebaseWithStore();
    }

    if (!poolPromise) {
        poolPromise = sql.connect(config)
            .then((pool) => {
                console.log("✅ Connected to SQL Server");
                return pool;
            })
            .catch((err) => {
                console.warn("⚠️ Dùng Firebase Firestore + Mock Engine cho Web Application!");
                return createMockPool();
            });
    }
    return poolPromise;
}

module.exports = {
    sql,
    connectDB,
    syncDocToFirebase,
    mockStore
};

