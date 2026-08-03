import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfigData from '../../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use custom database ID if provided in config, otherwise default
export const db = firebaseConfigData.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export const storage = getStorage(app);

export async function uploadImageToFirebase(file) {
  if (!file) return null;
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `products/${Date.now()}_${cleanFileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn("Firebase Storage upload encountered issue, fallback to Data URL:", error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
}

// Initial mock seed data to populate Firestore on first load
const INITIAL_DATA = {
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
  ]
};

let seedPromise = null;

export async function seedFirebaseIfEmpty() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      // Seed Categories
      const catSnap = await getDocs(collection(db, "DanhMuc"));
      if (catSnap.empty) {
        for (const cat of INITIAL_DATA.DanhMuc) {
          await setDoc(doc(db, "DanhMuc", String(cat.MaDM)), cat);
        }
        console.log("🔥 Firebase: Seeded DanhMuc successfully!");
      }

      // Seed Products
      const prodSnap = await getDocs(collection(db, "SanPham"));
      if (prodSnap.empty) {
        for (const sp of INITIAL_DATA.SanPham) {
          await setDoc(doc(db, "SanPham", String(sp.MaSP)), sp);
        }
        console.log("🔥 Firebase: Seeded SanPham successfully!");
      }

      // Seed Vouchers
      const voucherSnap = await getDocs(collection(db, "Voucher"));
      if (voucherSnap.empty) {
        for (const v of INITIAL_DATA.Voucher) {
          await setDoc(doc(db, "Voucher", String(v.MaVoucher)), v);
        }
        console.log("🔥 Firebase: Seeded Voucher successfully!");
      }
    } catch (err) {
      console.warn("Firebase seeding error (non-fatal):", err);
    }
  })();

  return seedPromise;
}

// Automatically initiate seeding on import
seedFirebaseIfEmpty();
