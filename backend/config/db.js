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
        { MaKH: 2, MaTK: 2, HoTen: "Nguyễn Văn Khách", Email: "user@gmail.com", SoDienThoai: "0987654321", DiaChi: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", NgayTao: new Date().toISOString() }
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
        { MaGG: 1, MaVoucher: 1, Code: "FREESHIP", MaCode: "FREESHIP", TenVoucher: "Miễn phí vận chuyển", LoaiGiam: "Cố định", GiaTriGiam: 30000, PhanTramGiam: 10, GiamToiDa: 30000, NgayBD: "2025-01-01", NgayKT: "2030-12-31", DieuKienApDung: 100000, GiaTriToiThieu: 100000, SoLuong: 100, SoDiemDoi: 50, TrangThai: true },
        { MaGG: 2, MaVoucher: 2, Code: "NONGSAN10", MaCode: "NONGSAN10", TenVoucher: "Giảm 10% nông sản sạch", LoaiGiam: "Phần trăm", GiaTriGiam: 10, PhanTramGiam: 10, GiamToiDa: 50000, NgayBD: "2025-01-01", NgayKT: "2030-12-31", DieuKienApDung: 150000, GiaTriToiThieu: 150000, SoLuong: 50, SoDiemDoi: 100, TrangThai: true },
        { MaGG: 3, MaVoucher: 3, Code: "TETHANHPHUC", MaCode: "TETHANHPHUC", TenVoucher: "Ưu đãi Tết Thanh Phúc 20k", LoaiGiam: "Cố định", GiaTriGiam: 20000, PhanTramGiam: 15, GiamToiDa: 20000, NgayBD: "2025-01-01", NgayKT: "2030-12-31", DieuKienApDung: 150000, GiaTriToiThieu: 150000, SoLuong: 80, SoDiemDoi: 30, TrangThai: true }
    ],
    KhachHang_Voucher: [],
    LichSuDiem: [
        { MaLSD: 1, MaKH: 2, LoaiDiem: "Cộng", LoaiGD: "Tích điểm", SoDiem: 200, NgayThucHien: new Date().toISOString(), GhiChu: "Thưởng khởi tạo" },
        { MaLSD: 2, MaKH: 1, LoaiDiem: "Cộng", LoaiGD: "Tích điểm", SoDiem: 500, NgayThucHien: new Date().toISOString(), GhiChu: "Thưởng khởi tạo" }
    ],
    DonHang: [
        { MaDH: 101, MaKH: 2, TenKhachHang: "Nguyễn Văn Khách", NguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChiChiTiet: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", NgayDat: new Date().toISOString(), PhiVanChuyen: 30000, TongTien: 212000, TrangThaiDonHang: "Đã giao", TrangThaiThanhToan: "Đã thanh toán" },
        { MaDH: 102, MaKH: 2, TenKhachHang: "Nguyễn Văn Khách", NguoiNhan: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChiChiTiet: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", NgayDat: new Date().toISOString(), PhiVanChuyen: 30000, TongTien: 125000, TrangThaiDonHang: "Chờ xác nhận", TrangThaiThanhToan: "Chưa thanh toán" }
    ],
    ChiTietDonHang: [
        { MaDH: 101, MaSP: 1, TenSP: "Táo Envy New Zealand", SoLuong: 2, DonGia: 85000, ThanhTien: 170000 },
        { MaDH: 101, MaSP: 8, TenSP: "Dưa Hấu Hoàng Kim", SoLuong: 1, DonGia: 42000, ThanhTien: 42000 },
        { MaDH: 102, MaSP: 3, TenSP: "Dâu Tây Đà Lạt Giống Mỹ", SoLuong: 1, DonGia: 129000, ThanhTien: 129000 }
    ],
    ThongBao: [
        { MaTB: 1, MaKH: 2, TieuDe: "Đơn hàng đã được giao thành công", NoiDung: "Đơn hàng #101 của bạn đã giao hoàn tất. Cảm ơn bạn đã mua hàng tại Nông Sản Shop!", DaDoc: false, NgayTao: new Date().toISOString() }
    ],
    DanhGia: [
        { MaDG: 1, MaKH: 2, MaSP: 1, SoSao: 5, NoiDung: "Táo rất tươi ngon, giòn ngọt, đóng gói cẩn thận!", NgayDG: new Date(Date.now() - 86400000 * 2).toISOString() },
        { MaDG: 2, MaKH: 2, MaSP: 3, SoSao: 5, NoiDung: "Dâu tây mọng nước, giao hàng nhanh.", NgayDG: new Date(Date.now() - 86400000).toISOString() }
    ],
    DiaChi: [
        { MaDC: 1, MaKH: 2, HoTen: "Nguyễn Văn Khách", SoDienThoai: "0987654321", DiaChiChiTiet: "123 Đường Nguyễn Huệ, Q.1, TP.HCM", MacDinh: 1 }
    ]
};

function getFirebaseDocId(tableName, item) {
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
    if (tableName === 'LichSuDiem' && item.MaLSD) return String(item.MaLSD);
    if (tableName === 'KhachHang_Voucher' && item.MaKH) return `${item.MaKH}_${item.MaVoucher || item.MaGG || Math.random()}`;

    if (item.MaDG) return String(item.MaDG);
    if (item.MaLSD) return String(item.MaLSD);
    if (item.MaTB) return String(item.MaTB);
    if (item.MaDC) return String(item.MaDC);
    if (item.MaDH) return String(item.MaDH);
    if (item.MaVoucher || item.MaGG) return String(item.MaVoucher || item.MaGG);
    if (item.MaDM) return String(item.MaDM);
    if (item.MaSP) return String(item.MaSP);
    if (item.MaKH) return String(item.MaKH);
    if (item.MaTK) return String(item.MaTK);
    if (item.id) return String(item.id);
    return String(Math.random());
}

// Hàm đồng bộ Firebase Firestore (Chạy bất đồng bộ, có Timeout 2s để không làm treo Serverless Vercel)
async function syncFirebaseWithStore() {
    try {
        console.log("🔥 Kết nối và đồng bộ dữ liệu với Firebase Firestore...");
        const tables = ["TaiKhoan", "KhachHang", "DanhMuc", "SanPham", "Voucher", "DonHang", "ChiTietDonHang", "ThongBao", "DanhGia", "DiaChi"];
        
        const fetchPromises = tables.map(async (tableName) => {
            try {
                const snap = await getDocs(collection(db, tableName));
                if (!snap.empty) {
                    const list = [];
                    snap.forEach((docSnap, index) => {
                        const data = docSnap.data();
                        if (tableName === 'DanhGia' && !data.MaDG) {
                            data.MaDG = Number(docSnap.id) || (index + 1);
                        }
                        list.push(data);
                    });
                    if (list.length > 0) {
                        mockStore[tableName] = list;
                    }
                } else {
                    if (mockStore[tableName] && mockStore[tableName].length > 0) {
                        Promise.allSettled(
                            mockStore[tableName].map(item => {
                                const docId = getFirebaseDocId(tableName, item);
                                return setDoc(doc(db, tableName, docId), JSON.parse(JSON.stringify(item)));
                            })
                        ).catch(() => {});
                    }
                }
            } catch (err) {
                console.warn(`Lỗi sync table ${tableName}:`, err.message);
            }
        });

        await Promise.race([
            Promise.allSettled(fetchPromises),
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);

        console.log("✅ Đồng bộ / Kiểm tra Firebase Firestore hoàn tất!");
    } catch (err) {
        console.warn("⚠️ Lưu ý đồng bộ Firebase (dùng mock data làm fallback):", err.message);
    }
}

// Lưu 1 item lên Firebase
async function syncDocToFirebase(tableName, item) {
    try {
        const docId = getFirebaseDocId(tableName, item);
        await setDoc(doc(db, tableName, docId), JSON.parse(JSON.stringify(item)), { merge: true });
    } catch (err) {
        console.error(`Error syncing ${tableName} to Firebase:`, err.message);
    }
}

async function deleteDocFromFirebase(tableName, id) {
    try {
        await deleteDoc(doc(db, tableName, String(id)));
    } catch (err) {
        console.error(`Error deleting ${tableName} from Firebase:`, err.message);
    }
}

function createMockPool() {
    return {
        request() {
            const inputs = {};
            const reqObj = {
                input(name, type, val) {
                    if (val === undefined) {
                        inputs[name] = type;
                    } else {
                        inputs[name] = val;
                    }
                    return reqObj;
                },
                async query(queryString) {
                    const q = queryString.trim().toUpperCase();

                    // --- DONHANG INSERTION (PRIORITY) ---
                    if (q.includes("INSERT INTO DONHANG")) {
                        let newMaDC = undefined;
                        if (q.includes("INSERT INTO SODIACHI")) {
                            const maxMaDC = (mockStore.DiaChi || []).reduce((max, d) => Math.max(max, Number(d.MaDC) || 0), 0);
                            newMaDC = maxMaDC + 1;
                            const newDC = {
                                MaDC: newMaDC,
                                MaKH: Number(inputs.MaKH) || 2,
                                HoTen: inputs.HoTen || "Khách Hàng",
                                SoDienThoai: inputs.SoDienThoai || "0987654321",
                                DiaChiChiTiet: inputs.DiaChiChiTiet || inputs.DiaChi || "",
                                MacDinh: 0
                            };
                            if (!mockStore.DiaChi) mockStore.DiaChi = [];
                            mockStore.DiaChi.push(newDC);
                        }

                        const maxMaDH = mockStore.DonHang.reduce((max, d) => Math.max(max, Number(d.MaDH) || 0), 100);
                        const newMaDH = maxMaDH + 1;
                        const maKH = Number(inputs.MaKH) || 2;
                        const maDC = newMaDC || Number(inputs.MaDC) || undefined;
                        const kh = mockStore.KhachHang.find(k => Number(k.MaKH) === maKH);
                        const dc = (mockStore.DiaChi || []).find(c => Number(c.MaDC) === maDC);

                        const newOrder = {
                            MaDH: newMaDH,
                            MaKH: maKH,
                            MaDC: maDC,
                            TenKhachHang: inputs.HoTen || inputs.TenKhachHang || (kh ? kh.HoTen : "Nguyễn Văn Khách"),
                            NguoiNhan: (dc ? dc.HoTen : null) || inputs.HoTen || inputs.NguoiNhan || inputs.TenNguoiNhan || (kh ? kh.HoTen : "Nguyễn Văn Khách"),
                            SoDienThoai: (dc ? dc.SoDienThoai : null) || inputs.SoDienThoai || (kh ? kh.SoDienThoai : "0987654321"),
                            DiaChiChiTiet: (dc ? dc.DiaChiChiTiet : null) || inputs.DiaChi || inputs.DiaChiChiTiet || (kh ? kh.DiaChi : "123 Đường Nguyễn Huệ, Q.1, TP.HCM"),
                            NgayDat: new Date().toISOString(),
                            PhiVanChuyen: Number(inputs.PhiVanChuyen) || 30000,
                            TongTien: Number(inputs.TongTien) || 0,
                            TrangThaiDonHang: inputs.TrangThaiDH || inputs.TrangThaiDonHang || "Chờ xác nhận",
                            TrangThaiThanhToan: inputs.TrangThaiTT || inputs.TrangThaiThanhToan || "Chưa thanh toán"
                        };
                        mockStore.DonHang.unshift(newOrder);
                        syncDocToFirebase("DonHang", newOrder);

                        // Parse chi tiết đơn hàng chèn kèm nếu có
                        if (q.includes("INSERT INTO CHITIETDONHANG")) {
                            const ctMatch = q.match(/INSERT INTO CHITIETDONHANG\s*\([^)]+\)\s*VALUES\s*(.+?);/i) || q.match(/INSERT INTO CHITIETDONHANG[^\n\r]+VALUES\s*(.+)/i);
                            if (ctMatch) {
                                const valuesStr = ctMatch[1];
                                const tupleRegex = /\(([^)]+)\)/g;
                                let match;
                                while ((match = tupleRegex.exec(valuesStr)) !== null) {
                                    const tuple = match[1].split(',').map(s => s.trim());
                                    if (tuple.length >= 5) {
                                        const maSP = Number(tuple[1]);
                                        const soLuong = Number(tuple[2]);
                                        const donGia = Number(tuple[3]);
                                        const thanhTien = Number(tuple[4]);
                                        const sp = mockStore.SanPham.find(s => Number(s.MaSP) === maSP);
                                        const newCT = {
                                            MaDH: newMaDH,
                                            MaSP: maSP,
                                            TenSP: sp ? sp.TenSP : "Sản phẩm",
                                            SoLuong: soLuong,
                                            DonGia: donGia,
                                            ThanhTien: thanhTien
                                        };
                                        mockStore.ChiTietDonHang.push(newCT);
                                        syncDocToFirebase("ChiTietDonHang", newCT);
                                    }
                                }
                            }
                        }

                        return { recordset: [{ maDH: newMaDH, MaDH: newMaDH }] };
                    }

                    // --- SELECT TAIKHOAN ---
                    if (q.includes("FROM TAIKHOAN")) {
                        let list = [...mockStore.TaiKhoan];
                        if (inputs.Email) {
                            const val = String(inputs.Email).toLowerCase().trim();
                            list = list.filter(u => 
                                (u.Email && u.Email.toLowerCase().trim() === val) || 
                                (u.TenDangNhap && u.TenDangNhap.toLowerCase().trim() === val)
                            );
                        }
                        if (inputs.TenDangNhap && !inputs.Email) {
                            const val = String(inputs.TenDangNhap).toLowerCase().trim();
                            list = list.filter(u => u.TenDangNhap && u.TenDangNhap.toLowerCase().trim() === val);
                        }
                        if (inputs.MaTK) list = list.filter(u => u.MaTK === Number(inputs.MaTK));
                        
                        list = list.map(u => {
                            const kh = (mockStore.KhachHang || []).find(k => Number(k.MaTK) === Number(u.MaTK) || (k.Email && u.Email && k.Email.toLowerCase().trim() === u.Email.toLowerCase().trim()));
                            const avatar = (kh && kh.HinhAnh) || u.HinhAnh || u.AvatarKhachHang || "";
                            const hoTen = (kh && kh.HoTen) || u.HoTen || u.TenDangNhap || "Khách Hàng";
                            const sdt = (kh && kh.SoDienThoai) || u.SoDienThoai || "";
                            const gioiTinh = (kh && kh.GioiTinh) || u.GioiTinh || "";
                            const ngaySinh = (kh && kh.NgaySinh) || u.NgaySinh || "";
                            return {
                                ...u,
                                HoTen: hoTen,
                                SoDienThoai: sdt,
                                GioiTinh: gioiTinh,
                                NgaySinh: ngaySinh,
                                HinhAnh: avatar,
                                AvatarKhachHang: avatar
                            };
                        });
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

                    // --- DANHMUC CRUD ---
                    if (q.includes("INSERT INTO DANHMUC")) {
                        const maxMa = mockStore.DanhMuc.reduce((max, d) => Math.max(max, Number(d.MaDM) || 0), 0);
                        const newDM = {
                            MaDM: maxMa + 1,
                            TenDM: inputs.TenDM,
                            MoTa: inputs.MoTa || "",
                            TrangThai: true
                        };
                        mockStore.DanhMuc.push(newDM);
                        syncDocToFirebase("DanhMuc", newDM);
                        return { recordset: [newDM] };
                    }

                    if (q.includes("UPDATE DANHMUC")) {
                        const targetMaDM = Number(inputs.MaDM);
                        const index = mockStore.DanhMuc.findIndex(d => Number(d.MaDM) === targetMaDM);
                        if (index !== -1) {
                            mockStore.DanhMuc[index] = {
                                ...mockStore.DanhMuc[index],
                                TenDM: inputs.TenDM !== undefined ? inputs.TenDM : mockStore.DanhMuc[index].TenDM,
                                MoTa: inputs.MoTa !== undefined ? inputs.MoTa : mockStore.DanhMuc[index].MoTa
                            };
                            syncDocToFirebase("DanhMuc", mockStore.DanhMuc[index]);
                        }
                        return { recordset: [] };
                    }

                    if (q.includes("DELETE FROM DANHMUC")) {
                        const targetMaDM = Number(inputs.MaDM);
                        const index = mockStore.DanhMuc.findIndex(d => Number(d.MaDM) === targetMaDM);
                        if (index !== -1) {
                            const deletedItem = mockStore.DanhMuc.splice(index, 1)[0];
                            deleteDocFromFirebase("DanhMuc", deletedItem.MaDM);
                        }
                        return { recordset: [] };
                    }

                    if (q.includes("FROM DANHMUC")) {
                        let list = mockStore.DanhMuc.filter(d => 
                            d.TrangThai === undefined || d.TrangThai === true || d.TrangThai === 1 || String(d.TrangThai) === "1" || String(d.TrangThai) === "true"
                        );
                        if (q.includes("<>") || q.includes("!=")) {
                            const nameVal = inputs.TenDM ? String(inputs.TenDM).trim().toLowerCase() : "";
                            list = list.filter(d => 
                                (nameVal ? (d.TenDM && d.TenDM.trim().toLowerCase() === nameVal) : true) &&
                                Number(d.MaDM) !== Number(inputs.MaDM)
                            );
                        } else {
                            if (inputs.TenDM) {
                                const nameVal = String(inputs.TenDM).trim().toLowerCase();
                                list = list.filter(d => d.TenDM && d.TenDM.trim().toLowerCase() === nameVal);
                            }
                            if (inputs.MaDM) {
                                list = list.filter(d => Number(d.MaDM) === Number(inputs.MaDM));
                            }
                        }
                        return { recordset: list };
                    }

                    // --- SANPHAM CRUD ---
                    if (q.includes("INSERT INTO SANPHAM")) {
                        const maxMa = mockStore.SanPham.reduce((max, s) => Math.max(max, Number(s.MaSP) || 0), 0);
                        const category = mockStore.DanhMuc.find(d => Number(d.MaDM) === Number(inputs.MaDM));
                        const newSp = {
                            MaSP: maxMa + 1,
                            TenSP: inputs.TenSP,
                            MaDM: Number(inputs.MaDM) || 1,
                            DonGia: Number(inputs.GiaGoc || inputs.DonGia) || 50000,
                            GiaGoc: Number(inputs.GiaGoc || inputs.DonGia) || 50000,
                            GiamToiDa: Number(inputs.GiamToiDa) || 30,
                            TuDongGiamGia: inputs.TuDongGiamGia ? 1 : 0,
                            MoTa: inputs.MoTa || "",
                            HinhAnh: inputs.HinhAnh || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop",
                            SoLuongTon: Number(inputs.SoLuongTon) || 50,
                            DonViTinh: inputs.DonViTinh || "Kg",
                            TrangThai: true,
                            TenDM: category ? category.TenDM : "Nông Sản"
                        };
                        mockStore.SanPham.unshift(newSp);
                        syncDocToFirebase("SanPham", newSp);
                        return { recordset: [newSp] };
                    }

                    if (q.includes("UPDATE SANPHAM")) {
                        const targetMaSP = Number(inputs.MaSP);
                        const index = mockStore.SanPham.findIndex(s => Number(s.MaSP) === targetMaSP);
                        if (index !== -1) {
                            const category = mockStore.DanhMuc.find(d => Number(d.MaDM) === Number(inputs.MaDM || mockStore.SanPham[index].MaDM));
                            mockStore.SanPham[index] = {
                                ...mockStore.SanPham[index],
                                TenSP: inputs.TenSP !== undefined ? inputs.TenSP : mockStore.SanPham[index].TenSP,
                                MaDM: inputs.MaDM !== undefined ? Number(inputs.MaDM) : mockStore.SanPham[index].MaDM,
                                DonGia: inputs.GiaGoc !== undefined ? Number(inputs.GiaGoc) : mockStore.SanPham[index].DonGia,
                                GiaGoc: inputs.GiaGoc !== undefined ? Number(inputs.GiaGoc) : mockStore.SanPham[index].GiaGoc,
                                GiamToiDa: inputs.GiamToiDa !== undefined ? Number(inputs.GiamToiDa) : mockStore.SanPham[index].GiamToiDa,
                                TuDongGiamGia: inputs.TuDongGiamGia !== undefined ? (inputs.TuDongGiamGia ? 1 : 0) : mockStore.SanPham[index].TuDongGiamGia,
                                MoTa: inputs.MoTa !== undefined ? inputs.MoTa : mockStore.SanPham[index].MoTa,
                                HinhAnh: inputs.HinhAnh ? inputs.HinhAnh : mockStore.SanPham[index].HinhAnh,
                                SoLuongTon: inputs.SoLuongTon !== undefined ? Number(inputs.SoLuongTon) : mockStore.SanPham[index].SoLuongTon,
                                DonViTinh: inputs.DonViTinh !== undefined ? inputs.DonViTinh : mockStore.SanPham[index].DonViTinh,
                                TrangThai: inputs.TrangThai !== undefined ? (inputs.TrangThai === '0' || inputs.TrangThai === 0 || inputs.TrangThai === 'false' || inputs.TrangThai === false ? 0 : 1) : mockStore.SanPham[index].TrangThai,
                                TenDM: category ? category.TenDM : mockStore.SanPham[index].TenDM
                            };
                            syncDocToFirebase("SanPham", mockStore.SanPham[index]);
                        }
                        return { recordset: [] };
                    }

                    if (q.includes("DELETE FROM SANPHAM")) {
                        const targetMaSP = Number(inputs.MaSP);
                        const index = mockStore.SanPham.findIndex(s => Number(s.MaSP) === targetMaSP);
                        if (index !== -1) {
                            const deletedItem = mockStore.SanPham.splice(index, 1)[0];
                            deleteDocFromFirebase("SanPham", deletedItem.MaSP);
                        }
                        return { recordset: [] };
                    }

                    if (q.includes("FROM SANPHAM")) {
                        let list = [...mockStore.SanPham];
                        const inMatch = q.match(/MASP\s+IN\s*\(([^)]+)\)/i);
                        if (inMatch) {
                            const ids = inMatch[1].split(',').map(id => Number(id.trim())).filter(n => !isNaN(n));
                            list = list.filter(s => ids.includes(Number(s.MaSP)));
                        }
                        if (q.includes("TRANGTHAI = 1") || q.includes("TRANGTHAI=1")) {
                            list = list.filter(s => 
                                s.TrangThai === undefined || s.TrangThai === true || s.TrangThai === 1 || String(s.TrangThai) === "1" || String(s.TrangThai) === "true"
                            );
                        }
                        if (inputs.TenSP) {
                            const nameVal = String(inputs.TenSP).trim().toLowerCase();
                            list = list.filter(s => s.TenSP && s.TenSP.trim().toLowerCase() === nameVal);
                        }
                        if (inputs.MaSP) list = list.filter(s => Number(s.MaSP) === Number(inputs.MaSP));
                        if (inputs.MaDM) list = list.filter(s => Number(s.MaDM) === Number(inputs.MaDM));
                        if (inputs.minPrice) list = list.filter(s => Number(s.DonGia) >= Number(inputs.minPrice));
                        if (inputs.maxPrice) list = list.filter(s => Number(s.DonGia) <= Number(inputs.maxPrice));
                        
                        if (q.includes("COUNT(*) AS TOTAL")) {
                            return { recordset: [{ Total: list.length }] };
                        }

                        if (inputs.offset !== undefined && inputs.limit !== undefined) {
                            const start = Number(inputs.offset) || 0;
                            const count = Number(inputs.limit) || 5;
                            list = list.slice(start, start + count);
                        }
                        
                        return { recordset: list };
                    }

                    // --- SELECT & CRUD MAGIAMGIA / VOUCHER ---
                    if (q.includes("MAGIAMGIA") || q.includes("VOUCHER") || q.includes("KHUYENMAI")) {
                        if (q.includes("INSERT INTO")) {
                            const maxId = (mockStore.Voucher || []).reduce((max, v) => Math.max(max, Number(v.MaGG || v.MaVoucher) || 0), 0);
                            const newV = {
                                MaGG: maxId + 1,
                                MaVoucher: maxId + 1,
                                Code: inputs.Code || `VC${maxId + 1}`,
                                MaCode: inputs.Code || `VC${maxId + 1}`,
                                TenVoucher: inputs.TenVoucher || `Mã giảm giá ${inputs.Code || maxId + 1}`,
                                LoaiGiam: inputs.LoaiGiam || "Cố định",
                                GiaTriGiam: Number(inputs.GiaTriGiam) || 20000,
                                PhanTramGiam: Number(inputs.GiaTriGiam) || 10,
                                GiamToiDa: Number(inputs.GiaTriGiam) || 20000,
                                NgayBD: inputs.NgayBD || "2025-01-01",
                                NgayKT: inputs.NgayKT || "2030-12-31",
                                DieuKienApDung: Number(inputs.DieuKienApDung) || 100000,
                                GiaTriToiThieu: Number(inputs.DieuKienApDung) || 100000,
                                SoLuong: Number(inputs.SoLuong) || 50,
                                SoDiemDoi: (inputs.SoDiemDoi !== undefined && inputs.SoDiemDoi !== null && inputs.SoDiemDoi !== "") ? Number(inputs.SoDiemDoi) : null,
                                TrangThai: true
                            };
                            if (!mockStore.Voucher) mockStore.Voucher = [];
                            mockStore.Voucher.push(newV);
                            syncDocToFirebase("Voucher", newV);
                            return { recordset: [newV] };
                        }

                        if (q.includes("UPDATE")) {
                            if (q.includes("SOLUONG = SOLUONG - 1")) {
                                const v = (mockStore.Voucher || []).find(x => Number(x.MaGG || x.MaVoucher) === Number(inputs.MaGG));
                                if (v && v.SoLuong > 0) {
                                    v.SoLuong -= 1;
                                    syncDocToFirebase("Voucher", v);
                                }
                            } else if (inputs.MaGG) {
                                const index = (mockStore.Voucher || []).findIndex(x => Number(x.MaGG || x.MaVoucher) === Number(inputs.MaGG));
                                if (index !== -1) {
                                    const current = mockStore.Voucher[index];
                                    const updated = {
                                        ...current,
                                        Code: inputs.Code || current.Code,
                                        MaCode: inputs.Code || current.MaCode,
                                        TenVoucher: inputs.Code || current.TenVoucher,
                                        LoaiGiam: inputs.LoaiGiam || current.LoaiGiam,
                                        GiaTriGiam: (inputs.GiaTriGiam !== undefined && inputs.GiaTriGiam !== null && inputs.GiaTriGiam !== "") ? Number(inputs.GiaTriGiam) : current.GiaTriGiam,
                                        PhanTramGiam: (inputs.GiaTriGiam !== undefined && inputs.GiaTriGiam !== null && inputs.GiaTriGiam !== "") ? Number(inputs.GiaTriGiam) : current.PhanTramGiam,
                                        GiamToiDa: (inputs.GiaTriGiam !== undefined && inputs.GiaTriGiam !== null && inputs.GiaTriGiam !== "") ? Number(inputs.GiaTriGiam) : current.GiamToiDa,
                                        NgayBD: inputs.NgayBD || current.NgayBD,
                                        NgayKT: inputs.NgayKT || current.NgayKT,
                                        DieuKienApDung: (inputs.DieuKienApDung !== undefined && inputs.DieuKienApDung !== null && inputs.DieuKienApDung !== "") ? Number(inputs.DieuKienApDung) : current.DieuKienApDung,
                                        GiaTriToiThieu: (inputs.DieuKienApDung !== undefined && inputs.DieuKienApDung !== null && inputs.DieuKienApDung !== "") ? Number(inputs.DieuKienApDung) : current.GiaTriToiThieu,
                                        SoLuong: (inputs.SoLuong !== undefined && inputs.SoLuong !== null && inputs.SoLuong !== "") ? Number(inputs.SoLuong) : current.SoLuong,
                                        SoDiemDoi: (inputs.SoDiemDoi !== undefined && inputs.SoDiemDoi !== null && inputs.SoDiemDoi !== "") ? Number(inputs.SoDiemDoi) : null
                                    };
                                    mockStore.Voucher[index] = updated;
                                    syncDocToFirebase("Voucher", updated);
                                }
                            }
                            return { recordset: [] };
                        }

                        if (q.includes("DELETE FROM")) {
                            if (inputs.MaGG) {
                                mockStore.Voucher = (mockStore.Voucher || []).filter(v => Number(v.MaGG || v.MaVoucher) !== Number(inputs.MaGG));
                                deleteDocFromFirebase("Voucher", inputs.MaGG);
                            }
                            return { recordset: [] };
                        }

                        // SELECT query
                        let list = [...(mockStore.Voucher || [])].map(v => ({
                            MaGG: Number(v.MaGG || v.MaVoucher || 1),
                            MaVoucher: Number(v.MaVoucher || v.MaGG || 1),
                            Code: v.Code || v.MaCode || "",
                            MaCode: v.MaCode || v.Code || "",
                            TenVoucher: v.TenVoucher || v.Code || "",
                            LoaiGiam: v.LoaiGiam || "Cố định",
                            GiaTriGiam: Number(v.GiaTriGiam || v.GiamToiDa || 20000),
                            PhanTramGiam: Number(v.PhanTramGiam || 10),
                            GiamToiDa: Number(v.GiamToiDa || v.GiaTriGiam || 20000),
                            NgayBD: v.NgayBD || "2025-01-01",
                            NgayKT: v.NgayKT || "2030-12-31",
                            DieuKienApDung: Number(v.DieuKienApDung || v.GiaTriToiThieu || 100000),
                            GiaTriToiThieu: Number(v.GiaTriToiThieu || v.DieuKienApDung || 100000),
                            SoLuong: Number(v.SoLuong || 0),
                            SoDiemDoi: (v.SoDiemDoi !== undefined && v.SoDiemDoi !== null && v.SoDiemDoi !== "") ? Number(v.SoDiemDoi) : null,
                            TrangThai: v.TrangThai !== undefined ? v.TrangThai : true
                        }));

                        if (q.includes("COUNT(*) AS TONGMAGIAMGIA")) {
                            return { recordset: [{ TongMaGiamGia: list.length }] };
                        }
                        if (q.includes("SOLUONG > 0")) {
                            list = list.filter(v => v.SoLuong > 0);
                        }
                        if (q.includes("SODIEMDOI IS NOT NULL")) {
                            list = list.filter(v => v.SoDiemDoi !== null && v.SoDiemDoi !== undefined);
                        }
                        if (q.includes("MAGG <>") || q.includes("MAGG<>")) {
                            if (inputs.MaGG) {
                                list = list.filter(v => Number(v.MaGG || v.MaVoucher) !== Number(inputs.MaGG));
                            }
                        }
                        if (inputs.Code) {
                            list = list.filter(v => String(v.Code).toLowerCase().trim() === String(inputs.Code).toLowerCase().trim());
                        }

                        return { recordset: list };
                    }

                    // --- SELECT & CRUD LICHSUDIEM ---
                    if (q.includes("LICHSUDIEM")) {
                        if (q.includes("INSERT INTO")) {
                            const newLSD = {
                                MaLSD: Date.now(),
                                MaKH: Number(inputs.MaKH) || 2,
                                LoaiDiem: inputs.LoaiDiem || "Cộng",
                                LoaiGD: inputs.LoaiGD || "Tích điểm",
                                SoDiem: Number(inputs.SoDiem) || 0,
                                NgayThucHien: new Date().toISOString(),
                                GhiChu: inputs.GhiChu || ""
                            };
                            if (!mockStore.LichSuDiem) mockStore.LichSuDiem = [];
                            mockStore.LichSuDiem.push(newLSD);
                            syncDocToFirebase("LichSuDiem", newLSD);
                            return { recordset: [newLSD] };
                        }

                        const targetMaKH = Number(inputs.MaKH) || 2;
                        const userPoints = (mockStore.LichSuDiem || []).filter(p => Number(p.MaKH) === targetMaKH);
                        
                        let total = 200; // Default 200 points
                        if (userPoints.length > 0) {
                            const cong = userPoints.filter(p => p.LoaiDiem === "Cộng").reduce((sum, p) => sum + (Number(p.SoDiem) || 0), 0);
                            const tru = userPoints.filter(p => p.LoaiDiem === "Trừ").reduce((sum, p) => sum + (Number(p.SoDiem) || 0), 0);
                            total = Math.max(0, cong - tru);
                        }

                        return { recordset: [{ tongDiem: total }] };
                    }

                    // --- SELECT & CRUD KHACHHANG_VOUCHER ---
                    if (q.includes("KHACHHANG_VOUCHER")) {
                        if (q.includes("INSERT INTO")) {
                            const newKV = {
                                MaKHV: Date.now(),
                                MaKH: Number(inputs.MaKH) || 2,
                                MaGG: Number(inputs.MaGG) || 1,
                                NgayDoi: new Date().toISOString(),
                                DaSuDung: 0
                            };
                            if (!mockStore.KhachHang_Voucher) mockStore.KhachHang_Voucher = [];
                            mockStore.KhachHang_Voucher.push(newKV);
                            syncDocToFirebase("KhachHang_Voucher", newKV);
                            return { recordset: [newKV] };
                        }

                        let list = mockStore.KhachHang_Voucher || [];
                        if (inputs.MaKH) list = list.filter(kv => Number(kv.MaKH) === Number(inputs.MaKH));
                        if (inputs.MaGG) list = list.filter(kv => Number(kv.MaGG) === Number(inputs.MaGG));

                        // If joined with MaGiamGia
                        const joined = list.map(kv => {
                            const mg = (mockStore.Voucher || []).find(v => Number(v.MaGG || v.MaVoucher) === Number(kv.MaGG)) || {};
                            return {
                                MaKHV: kv.MaKHV,
                                NgayDoi: kv.NgayDoi,
                                DaSuDung: kv.DaSuDung,
                                MaGG: kv.MaGG,
                                Code: mg.Code || mg.MaCode || "VOUCHER",
                                LoaiGiam: mg.LoaiGiam || "Cố định",
                                GiaTriGiam: Number(mg.GiaTriGiam || mg.GiamToiDa || 20000),
                                NgayKT: mg.NgayKT || "2030-12-31",
                                DieuKienApDung: Number(mg.DieuKienApDung || mg.GiaTriToiThieu || 100000)
                            };
                        });

                        return { recordset: joined };
                    }

                    // --- SELECT & INSERT KHACHHANG ---
                    if (q.includes("INSERT INTO KHACHHANG")) {
                        const maxMaKH = mockStore.KhachHang.reduce((max, k) => Math.max(max, Number(k.MaKH) || 0), 0);
                        const newKh = {
                            MaKH: maxMaKH + 1,
                            MaTK: Number(inputs.MaTK) || (maxMaKH + 1),
                            HoTen: inputs.HoTen || "Khách Hàng",
                            Email: inputs.Email || "",
                            SoDienThoai: inputs.SoDienThoai || "",
                            DiaChi: "",
                            NgayTao: new Date().toISOString()
                        };
                        mockStore.KhachHang.push(newKh);
                        syncDocToFirebase("KhachHang", newKh);
                        return { recordset: [newKh] };
                    }

                    if (q.includes("UPDATE TAIKHOAN")) {
                        const maTK = inputs.MaTK;
                        const maKH = inputs.MaKH;
                        let targetTk = null;
                        let targetKh = null;

                        if (maKH) {
                            targetKh = (mockStore.KhachHang || []).find(k => Number(k.MaKH) === Number(maKH));
                        }
                        if (maTK) {
                            targetTk = (mockStore.TaiKhoan || []).find(u => Number(u.MaTK) === Number(maTK));
                        }
                        if (!targetTk && targetKh) {
                            targetTk = (mockStore.TaiKhoan || []).find(u => Number(u.MaTK) === Number(targetKh.MaTK) || (u.Email && targetKh.Email && u.Email.toLowerCase() === targetKh.Email.toLowerCase()));
                        }
                        if (!targetKh && targetTk) {
                            targetKh = (mockStore.KhachHang || []).find(k => Number(k.MaTK) === Number(targetTk.MaTK) || (k.Email && targetTk.Email && k.Email.toLowerCase() === targetTk.Email.toLowerCase()));
                        }

                        const isBoolStatus = inputs.TrangThai === true || inputs.TrangThai === 1 || inputs.TrangThai === "1" || inputs.TrangThai === "true";

                        if (targetKh) {
                            if (targetKh.Email === "admin@gmail.com") {
                                targetKh.TrangThai = true;
                            } else if (inputs.TrangThai !== undefined) {
                                targetKh.TrangThai = isBoolStatus;
                            }
                            if (inputs.HoTen && inputs.HoTen !== null) targetKh.HoTen = inputs.HoTen;
                            if (inputs.SoDienThoai && inputs.SoDienThoai !== null) targetKh.SoDienThoai = inputs.SoDienThoai;
                            if (inputs.GioiTinh && inputs.GioiTinh !== null) targetKh.GioiTinh = inputs.GioiTinh;
                            if (inputs.NgaySinh && inputs.NgaySinh !== null) targetKh.NgaySinh = inputs.NgaySinh;
                            if (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') {
                                targetKh.HinhAnh = inputs.HinhAnh;
                            }
                            syncDocToFirebase("KhachHang", targetKh);
                        }

                        if (targetTk) {
                            if (targetTk.VaiTro === "Admin" || targetTk.Email === "admin@gmail.com") {
                                targetTk.TrangThai = true;
                            } else if (inputs.TrangThai !== undefined) {
                                targetTk.TrangThai = isBoolStatus;
                            }
                            if (inputs.HoTen && inputs.HoTen !== null) targetTk.HoTen = inputs.HoTen;
                            if (inputs.SoDienThoai && inputs.SoDienThoai !== null) targetTk.SoDienThoai = inputs.SoDienThoai;
                            if (inputs.GioiTinh && inputs.GioiTinh !== null) targetTk.GioiTinh = inputs.GioiTinh;
                            if (inputs.NgaySinh && inputs.NgaySinh !== null) targetTk.NgaySinh = inputs.NgaySinh;
                            if (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') {
                                targetTk.HinhAnh = inputs.HinhAnh;
                            }
                            syncDocToFirebase("TaiKhoan", targetTk);
                        } else if (targetKh) {
                            const newTk = {
                                MaTK: targetKh.MaTK || targetKh.MaKH,
                                TenDangNhap: targetKh.Email || targetKh.HoTen,
                                Email: targetKh.Email,
                                SoDienThoai: targetKh.SoDienThoai || "",
                                HinhAnh: (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') ? inputs.HinhAnh : (targetKh.HinhAnh || ""),
                                VaiTro: "KhachHang",
                                TrangThai: (targetKh.Email === "admin@gmail.com") ? true : isBoolStatus
                            };
                            mockStore.TaiKhoan.push(newTk);
                            syncDocToFirebase("TaiKhoan", newTk);
                        }

                        return { recordset: targetTk ? [targetTk] : [] };
                    }

                    if (q.includes("UPDATE KHACHHANG")) {
                        const maTK = inputs.MaTK;
                        const maKH = inputs.MaKH;
                        let targetKh = null;
                        let targetTk = null;

                        if (maTK) {
                            targetKh = (mockStore.KhachHang || []).find(k => Number(k.MaTK) === Number(maTK) || Number(k.MaKH) === Number(maTK));
                            targetTk = (mockStore.TaiKhoan || []).find(u => Number(u.MaTK) === Number(maTK));
                        }
                        if (!targetKh && maKH) {
                            targetKh = (mockStore.KhachHang || []).find(k => Number(k.MaKH) === Number(maKH));
                        }
                        if (!targetTk && targetKh) {
                            targetTk = (mockStore.TaiKhoan || []).find(u => Number(u.MaTK) === Number(targetKh.MaTK) || (u.Email && targetKh.Email && u.Email.toLowerCase() === targetKh.Email.toLowerCase()));
                        }

                        if (!targetKh && (maTK || targetTk)) {
                            const maxMaKH = (mockStore.KhachHang || []).reduce((max, k) => Math.max(max, Number(k.MaKH) || 0), 0);
                            targetKh = {
                                MaKH: maxMaKH + 1,
                                MaTK: maTK ? Number(maTK) : (targetTk ? Number(targetTk.MaTK) : undefined),
                                HoTen: inputs.HoTen || (targetTk ? (targetTk.HoTen || targetTk.TenDangNhap) : "Khách Hàng"),
                                Email: targetTk ? targetTk.Email : "",
                                SoDienThoai: inputs.SoDienThoai || (targetTk ? targetTk.SoDienThoai : ""),
                                GioiTinh: inputs.GioiTinh || "Nam",
                                NgaySinh: inputs.NgaySinh || "",
                                HinhAnh: (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') ? inputs.HinhAnh : (targetTk ? targetTk.HinhAnh : ""),
                                TrangThai: true
                            };
                            if (!mockStore.KhachHang) mockStore.KhachHang = [];
                            mockStore.KhachHang.push(targetKh);
                        }

                        if (targetKh) {
                            if (inputs.HoTen !== undefined && inputs.HoTen !== null) targetKh.HoTen = inputs.HoTen;
                            if (inputs.GioiTinh !== undefined && inputs.GioiTinh !== null) targetKh.GioiTinh = inputs.GioiTinh;
                            if (inputs.NgaySinh !== undefined && inputs.NgaySinh !== null) targetKh.NgaySinh = inputs.NgaySinh;
                            if (inputs.SoDienThoai !== undefined && inputs.SoDienThoai !== null) targetKh.SoDienThoai = inputs.SoDienThoai;
                            if (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') {
                                targetKh.HinhAnh = inputs.HinhAnh;
                            }
                            syncDocToFirebase("KhachHang", targetKh);
                        }

                        if (targetTk) {
                            if (inputs.HoTen !== undefined && inputs.HoTen !== null) targetTk.HoTen = inputs.HoTen;
                            if (inputs.GioiTinh !== undefined && inputs.GioiTinh !== null) targetTk.GioiTinh = inputs.GioiTinh;
                            if (inputs.NgaySinh !== undefined && inputs.NgaySinh !== null) targetTk.NgaySinh = inputs.NgaySinh;
                            if (inputs.SoDienThoai !== undefined && inputs.SoDienThoai !== null) targetTk.SoDienThoai = inputs.SoDienThoai;
                            if (inputs.HinhAnh && typeof inputs.HinhAnh === 'string' && inputs.HinhAnh.trim() !== '') {
                                targetTk.HinhAnh = inputs.HinhAnh;
                            }
                            syncDocToFirebase("TaiKhoan", targetTk);
                        }

                        return { recordset: targetKh ? [targetKh] : [] };
                    }

                    if (q.includes("FROM KHACHHANG")) {
                        let list = [...mockStore.KhachHang];
                        if (inputs.MaTK) {
                            list = list.filter(k => Number(k.MaTK) === Number(inputs.MaTK) || Number(k.MaKH) === Number(inputs.MaTK));
                        }
                        if (inputs.MaKH) {
                            list = list.filter(k => Number(k.MaKH) === Number(inputs.MaKH));
                        }

                        list = list.map(k => {
                            const tk = (mockStore.TaiKhoan || []).find(u => Number(u.MaTK) === Number(k.MaTK) || (u.Email && k.Email && u.Email.toLowerCase() === k.Email.toLowerCase()));
                            
                            const email = k.Email || (tk ? tk.Email : "");
                            const sdt = k.SoDienThoai || (tk ? tk.SoDienThoai : "");
                            const vaiTro = (tk ? tk.VaiTro : null) || (email === "admin@gmail.com" ? "Admin" : "KhachHang");
                            
                            let isStatusActive = true;
                            if (vaiTro === "Admin" || email === "admin@gmail.com") {
                                isStatusActive = true;
                            } else if (k.TrangThai !== undefined && k.TrangThai !== null) {
                                isStatusActive = k.TrangThai === true || k.TrangThai === 1 || k.TrangThai === "1" || k.TrangThai === "true";
                            } else if (tk) {
                                isStatusActive = tk.TrangThai !== false && tk.TrangThai !== 0 && tk.TrangThai !== "0" && tk.TrangThai !== "false" && tk.TrangThai !== "Đã khóa";
                            }

                            // Tính điểm thưởng & điểm xếp hạng
                            const userLSD = (mockStore.LichSuDiem || []).filter(p => Number(p.MaKH) === Number(k.MaKH) || Number(p.MaTK) === Number(k.MaTK));
                            const cong = userLSD.filter(p => p.LoaiDiem === "Cộng").reduce((s, p) => s + (Number(p.SoDiem) || 0), 0);
                            const tru = userLSD.filter(p => p.LoaiDiem === "Trừ").reduce((s, p) => s + (Number(p.SoDiem) || 0), 0);
                            const diemLichSu = Math.max(0, cong - tru);

                            const totalSpent = (mockStore.DonHang || []).filter(o => Number(o.MaKH) === Number(k.MaKH) || Number(o.MaTK) === Number(k.MaTK)).reduce((s, o) => s + (Number(o.TongTien) || 0), 0);
                            const diemDonHang = Math.floor(totalSpent / 500);

                            const totalPoints = Math.max(Number(k.DiemThuong) || 0, diemLichSu + diemDonHang);

                            let rank = "Đồng";
                            if (totalPoints >= 10000) rank = "Kim Cương";
                            else if (totalPoints >= 5000) rank = "Vàng";
                            else if (totalPoints >= 1000) rank = "Bạc";
                            else rank = "Đồng";

                            return {
                                ...k,
                                Email: email,
                                SoDienThoai: sdt,
                                VaiTro: vaiTro,
                                TrangThai: isStatusActive,
                                DiemThuong: totalPoints,
                                DiemXepHang: totalPoints,
                                TenHang: k.TenHang || rank
                            };
                        });

                        return { recordset: list };
                    }

                    // --- DONHANG UPDATE / SELECT ---

                    // --- SODIACHI CRUD ---
                    if (q.includes("INSERT INTO SODIACHI")) {
                        const maxMaDC = (mockStore.DiaChi || []).reduce((max, d) => Math.max(max, Number(d.MaDC) || 0), 0);
                        const newDC = {
                            MaDC: maxMaDC + 1,
                            MaKH: Number(inputs.MaKH) || 2,
                            HoTen: inputs.HoTen || "Khách Hàng",
                            SoDienThoai: inputs.SoDienThoai || "0987654321",
                            DiaChiChiTiet: inputs.DiaChiChiTiet || inputs.DiaChi || "",
                            MacDinh: inputs.MacDinh ? 1 : 0
                        };
                        if (!mockStore.DiaChi) mockStore.DiaChi = [];
                        mockStore.DiaChi.push(newDC);
                        syncDocToFirebase("DiaChi", newDC);
                        return { recordset: [{ MaDC: newDC.MaDC, maDC: newDC.MaDC }] };
                    }

                    if (q.includes("UPDATE DONHANG")) {
                        const targetMaDH = Number(inputs.MaDH);
                        const index = mockStore.DonHang.findIndex(d => Number(d.MaDH) === targetMaDH);
                        if (index !== -1) {
                            if (inputs.TrangThaiDonHang !== undefined) {
                                mockStore.DonHang[index].TrangThaiDonHang = inputs.TrangThaiDonHang;
                                mockStore.DonHang[index].TrangThai = inputs.TrangThaiDonHang;
                            }
                            if (inputs.TrangThaiThanhToan !== undefined) {
                                mockStore.DonHang[index].TrangThaiThanhToan = inputs.TrangThaiThanhToan;
                            }
                            syncDocToFirebase("DonHang", mockStore.DonHang[index]);
                        }
                        return { recordset: [] };
                    }

                    if (q.includes("FROM DONHANG")) {
                        let list = mockStore.DonHang.map(d => {
                            const kh = mockStore.KhachHang.find(k => Number(k.MaKH) === Number(d.MaKH));
                            const dc = (mockStore.DiaChi || []).find(c => Number(c.MaDC) === Number(d.MaDC));
                            return {
                                ...d,
                                MaTK: kh ? kh.MaTK : d.MaTK,
                                TenKhachHang: (kh ? kh.HoTen : null) || d.TenKhachHang || "Nguyễn Văn Khách",
                                NguoiNhan: d.NguoiNhan || (dc ? dc.HoTen : null) || d.TenNguoiNhan || d.TenKhachHang || (kh ? kh.HoTen : "Nguyễn Văn Khách"),
                                SoDienThoai: d.SoDienThoai || (dc ? dc.SoDienThoai : null) || (kh ? kh.SoDienThoai : "0987654321"),
                                DiaChiChiTiet: d.DiaChiChiTiet || (dc ? dc.DiaChiChiTiet : null) || d.DiaChi || (kh ? kh.DiaChi : "123 Đường Nguyễn Huệ, Q.1, TP.HCM"),
                                NgayDat: d.NgayDat || d.NgayTao || new Date().toISOString(),
                                TrangThaiDonHang: d.TrangThaiDonHang || (d.TrangThai === "Đang xử lý" ? "Chờ xác nhận" : d.TrangThai) || "Chờ xác nhận",
                                TrangThaiThanhToan: d.TrangThaiThanhToan || "Chưa thanh toán"
                            };
                        });

                        if (inputs.Status) {
                            list = list.filter(d => d.TrangThaiDonHang === inputs.Status);
                        }
                        if (inputs.FromDate) {
                            const fromStr = String(inputs.FromDate).split('T')[0];
                            const parts = fromStr.split('-').map(Number);
                            if (parts.length === 3 && parts[0]) {
                                const from = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
                                list = list.filter(d => new Date(d.NgayDat) >= from);
                            }
                        }
                        if (inputs.ToDate) {
                            const toStr = String(inputs.ToDate).split('T')[0];
                            const parts = toStr.split('-').map(Number);
                            if (parts.length === 3 && parts[0]) {
                                const to = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
                                list = list.filter(d => new Date(d.NgayDat) <= to);
                            }
                        }
                        if (inputs.MaKH) {
                            list = list.filter(d => Number(d.MaKH) === Number(inputs.MaKH));
                        }
                        if (inputs.MaTK) {
                            const kh = mockStore.KhachHang.find(k => Number(k.MaTK) === Number(inputs.MaTK));
                            if (kh) {
                                list = list.filter(d => Number(d.MaKH) === Number(kh.MaKH));
                            } else {
                                list = list.filter(d => Number(d.MaKH) === Number(inputs.MaTK));
                            }
                        }
                        if (inputs.MaDH) {
                            list = list.filter(d => Number(d.MaDH) === Number(inputs.MaDH));
                        }
                        if (inputs.MaSP) {
                            const validMaDHs = (mockStore.ChiTietDonHang || [])
                                .filter(ct => Number(ct.MaSP) === Number(inputs.MaSP))
                                .map(ct => Number(ct.MaDH));
                            list = list.filter(d => validMaDHs.includes(Number(d.MaDH)));
                        }
                        list.sort((a, b) => Number(b.MaDH) - Number(a.MaDH));
                        return { recordset: list };
                    }

                    // --- DANHGIA CRUD ---
                    if (q.includes("INSERT INTO DANHGIA")) {
                        const maxMaDG = (mockStore.DanhGia || []).reduce((max, d) => Math.max(max, Number(d.MaDG) || 0), 0);
                        const newMaDG = maxMaDG + 1;
                        const newDG = {
                            MaDG: newMaDG,
                            MaKH: Number(inputs.MaKH) || 2,
                            MaSP: Number(inputs.MaSP) || 1,
                            SoSao: Number(inputs.SoSao) || 5,
                            NoiDung: inputs.NoiDung || "",
                            NgayDG: new Date().toISOString()
                        };
                        if (!mockStore.DanhGia) mockStore.DanhGia = [];
                        mockStore.DanhGia.unshift(newDG);
                        syncDocToFirebase("DanhGia", newDG);
                        return { recordset: [newDG] };
                    }

                    if (q.includes("FROM DANHGIA")) {
                        let list = (mockStore.DanhGia || []).map(dg => {
                            const kh = (mockStore.KhachHang || []).find(k => Number(k.MaKH) === Number(dg.MaKH));
                            const sp = (mockStore.SanPham || []).find(s => Number(s.MaSP) === Number(dg.MaSP));
                            return {
                                ...dg,
                                HoTen: kh ? kh.HoTen : (dg.HoTen || "Khách hàng"),
                                MaTK: kh ? kh.MaTK : dg.MaKH,
                                TenSP: sp ? sp.TenSP : "Sản phẩm",
                                HinhAnh: sp ? sp.HinhAnh : ""
                            };
                        });

                        if (inputs.MaSP) {
                            list = list.filter(dg => Number(dg.MaSP) === Number(inputs.MaSP));
                        }
                        if (inputs.MaTK) {
                            list = list.filter(dg => Number(dg.MaTK) === Number(inputs.MaTK) || Number(dg.MaKH) === Number(inputs.MaTK));
                        }

                        list.sort((a, b) => new Date(b.NgayDG) - new Date(a.NgayDG));
                        return { recordset: list };
                    }

                    // --- CHITIETDONHANG CRUD ---
                    if (q.includes("FROM CHITIETDONHANG")) {
                        let list = [...mockStore.ChiTietDonHang];
                        if (inputs.MaDH) {
                            list = list.filter(ct => Number(ct.MaDH) === Number(inputs.MaDH));
                        }
                        list = list.map(ct => {
                            const sp = mockStore.SanPham.find(s => Number(s.MaSP) === Number(ct.MaSP));
                            return {
                                ...ct,
                                TenSP: ct.TenSP || (sp ? sp.TenSP : "Sản phẩm")
                            };
                        });
                        return { recordset: list };
                    }

                    if (q.includes("INSERT INTO CHITIETDONHANG")) {
                        return { recordset: [] };
                    }

                    // --- SELECT & UPDATE THONGBAO ---
                    if (q.includes("FROM THONGBAO")) {
                        let list = [...mockStore.ThongBao];
                        if (inputs.MaTK) list = list.filter(t => Number(t.MaTK) === Number(inputs.MaTK) || Number(t.MaKH) === Number(inputs.MaTK));
                        if (inputs.MaKH) list = list.filter(t => Number(t.MaKH) === Number(inputs.MaKH));
                        return { recordset: list };
                    }

                    if (q.includes("UPDATE THONGBAO")) {
                        mockStore.ThongBao.forEach(t => {
                            if (!inputs.MaTK || Number(t.MaTK) === Number(inputs.MaTK) || Number(t.MaKH) === Number(inputs.MaTK)) {
                                t.DaDoc = true;
                                syncDocToFirebase("ThongBao", t);
                            }
                        });
                        return { recordset: [] };
                    }

                    // --- DEFAULT FALLBACK FOR ANY QUERY ---
                    return { recordset: [] };
                }
            };
            return reqObj;
        }
    };
}

let syncPromise = null;

async function connectDB() {
    if (!syncPromise) {
        syncPromise = Promise.race([
            syncFirebaseWithStore(),
            new Promise(resolve => setTimeout(resolve, 1500))
        ]);
    }
    try {
        await syncPromise;
    } catch (e) {
        // Ignored timeout error
    }

    if (process.env.ENABLE_MSSQL_CONNECT) {
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

    return createMockPool();
}

module.exports = {
    sql,
    connectDB,
    syncDocToFirebase,
    mockStore
};

