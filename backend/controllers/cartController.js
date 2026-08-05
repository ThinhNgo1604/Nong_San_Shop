const { connectDB, sql } = require("../config/db");
const notificationModel = require("../models/notificationModel");
const redisClient = require("../config/redis");
const calculatePrice = require("../utils/priceCalculator");

// 1. Lấy chi tiết giỏ hàng theo Mã Tài Khoản
const getCartByCustomerId = async (req, res) => {
  try {
    const maTK = req.params.maKH; 
    const pool = await connectDB(); 

    const khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');

    if (khResult.recordset.length === 0) return res.json([]); 
    const realMaKH = khResult.recordset[0].MaKH;
    
    // 1. Lấy mảng sản phẩm từ Redis
    const redisKey = `cart:${realMaKH}`;
    const cartData = await redisClient.get(redisKey);
    
    if (!cartData) return res.json([]); 
    const cart = JSON.parse(cartData);
    if (cart.length === 0) return res.json([]);

    // 2. Lấy chi tiết sản phẩm từ SQL dựa trên danh sách ID trong Redis
    const productIds = cart.map(item => item.maSP).join(',');
    
    const result = await pool.request().query(`
        SELECT 
            MaSP AS id, 
            TenSP AS name, 
            DonGia, 
            GiaGoc,          
            GiamToiDa,       
            TuDongGiamGia,   
            HinhAnh
        FROM SanPham
        WHERE MaSP IN (${productIds})
    `);

    // 3. Map số lượng từ Redis sang kết quả SQL và tính lại giá
    const cartItems = cart.map(item => {
        const pId = Number(item.maSP);
        const product = result.recordset.find(p => Number(p.id || p.MaSP) === pId);
        if (!product) return null;
        const pName = product.name || product.TenSP;
        const finalPrice = calculatePrice(product);

        return {
            id: pId,
            maSP: pId,
            name: pName,
            TenSP: pName,
            price: finalPrice,
            quantity: Number(item.soLuong) || 1,
            HinhAnh: product.HinhAnh
        };
    }).filter(Boolean);

    res.json(cartItems);
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng Redis:", error);
    res.status(500).json({ message: "Lỗi server khi tải giỏ hàng" });
  }
};

// 2. Chốt đơn hàng
const checkoutCart = async (req, res) => {
  try {
    const {
        isGuest, 
        maKH: maTK,
        maDC, 
        guestInfo,
        cartItems,
        tongTien,
        trangThaiThanhToan
    } = req.body;

    const pool = await connectDB();
    const ttDH = 'Chờ xác nhận';
    const ttTT = trangThaiThanhToan || 'Chưa thanh toán';

    // ===== NHÁNH 1: DÀNH CHO KHÁCH VÃNG LAI =====
    if (isGuest) {
        if (!guestInfo || !guestInfo.hoTen || !guestInfo.soDienThoai || !guestInfo.diaChi) {
            return res.status(400).json({ message: "Vui lòng điền đủ thông tin giao hàng" });
        }
        if (!cartItems || cartItems.length === 0) return res.status(400).json({ message: "Giỏ hàng trống" });

        for (const item of cartItems) {
            const stock = await pool.request()
                .input("MaSP", sql.Int, item.id || item.maSP)
                .query(`SELECT TenSP, SoLuongTon FROM SanPham WHERE MaSP = @MaSP`);
            if (stock.recordset.length === 0) return res.status(400).json({ message: "Sản phẩm không tồn tại." });
            const sp = stock.recordset[0];
            if (item.quantity > sp.SoLuongTon) return res.status(400).json({ message: `${sp.TenSP} chỉ còn ${sp.SoLuongTon} sản phẩm.` });
        }

        const valuesCTDH = cartItems.map(item => 
            `(@MaDH, ${Number(item.id || item.maSP)}, ${Number(item.quantity)}, ${Number(item.price)}, ${Number(item.quantity) * Number(item.price)})`
        ).join(', ');

        // Tính lại phí vận chuyển thực tế để gỡ code cứng 30k
        let calculatedSubTotal = cartItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
        let actualShippingFee = tongTien - calculatedSubTotal;

        const resultGuest = await pool.request()
            .input('HoTen', sql.NVarChar(100), guestInfo.hoTen)
            .input('SoDienThoai', sql.VarChar(20), guestInfo.soDienThoai)
            .input('DiaChi', sql.NVarChar(255), guestInfo.diaChi)
            .input('PhiVanChuyen', sql.Decimal(18,2), actualShippingFee)
            .input('TongTien', sql.Decimal(18,2), tongTien)
            .input('TrangThaiDH', sql.NVarChar(50), ttDH)
            .input('TrangThaiTT', sql.NVarChar(50), ttTT)
            .query(`
                BEGIN TRAN;
                BEGIN TRY
                    DECLARE @DummyMaTK INT; DECLARE @DummyMaKH INT; DECLARE @NewMaDC INT; DECLARE @MaDH INT;
                    SELECT @DummyMaTK = MaTK FROM TaiKhoan WHERE TenDangNhap = 'khachvanglai';
                    IF @DummyMaTK IS NULL BEGIN INSERT INTO TaiKhoan (TenDangNhap, MatKhau, Email, SoDienThoai, VaiTro, TrangThai, NgayTao) VALUES ('khachvanglai', '123456', 'guest@nongsanshop.com', NULL, 'KhachHang', 1, GETDATE()); SET @DummyMaTK = SCOPE_IDENTITY(); END
                    SELECT @DummyMaKH = MaKH FROM KhachHang WHERE MaTK = @DummyMaTK;
                    IF @DummyMaKH IS NULL BEGIN INSERT INTO KhachHang (HoTen, MaTK) VALUES ('Khách Vãng Lai', @DummyMaTK); SET @DummyMaKH = SCOPE_IDENTITY(); END
                    
                    INSERT INTO SoDiaChi (MaKH, HoTen, SoDienThoai, DiaChiChiTiet, MacDinh) VALUES (@DummyMaKH, @HoTen, @SoDienThoai, @DiaChi, 0); SET @NewMaDC = SCOPE_IDENTITY();
                    INSERT INTO DonHang (MaKH, MaDC, NgayDat, PhiVanChuyen, TongTien, TrangThaiDonHang, TrangThaiThanhToan) VALUES (@DummyMaKH, @NewMaDC, GETDATE(), @PhiVanChuyen, @TongTien, @TrangThaiDH, @TrangThaiTT); SET @MaDH = SCOPE_IDENTITY();
                    INSERT INTO ChiTietDonHang (MaDH, MaSP, SoLuong, DonGia, ThanhTien) VALUES ${valuesCTDH};
                    COMMIT TRAN;
                    SELECT @MaDH AS maDH; 
                END TRY
                BEGIN CATCH ROLLBACK TRAN; THROW; END CATCH
            `);

        console.log("DEBUG resultGuest:", resultGuest);
        const maDH = (resultGuest && resultGuest.recordset && resultGuest.recordset[0]) ? (resultGuest.recordset[0].maDH || resultGuest.recordset[0].MaDH) : null;
        
        if (maTK) {
            try {
                await notificationModel.createNotification(
                    maTK,
                    'order',
                    'Tạo đơn hàng thành công 📦',
                    `Đơn hàng #${maDH} đã được tạo thành công với tổng tiền ${Number(tongTien || 0).toLocaleString('vi-VN')}đ và đang chờ admin duyệt.`
                );
            } catch (notifErr) {
                console.error("Lỗi tạo thông báo đơn hàng mới:", notifErr);
            }
        }

        return res.json({ message: "Chốt đơn thành công!", maDH });
    } 

    // ===== NHÁNH 2: LOGIC USER CÓ TÀI KHOẢN (SỬ DỤNG REDIS) =====
    if (!tongTien || tongTien <= 0) return res.status(400).json({ message: "Tổng tiền không hợp lệ" });

    let khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH, HoTen FROM KhachHang WHERE MaTK = @MaTK OR MaKH = @MaTK');

    let realMaKH;
    if (khResult.recordset.length === 0) {
        const tkRes = await pool.request().input('MaTK', sql.Int, maTK).query('SELECT Email, TenDangNhap, SoDienThoai FROM TaiKhoan WHERE MaTK = @MaTK');
        const tkUser = tkRes.recordset[0] || {};
        const userName = tkUser.TenDangNhap || (tkUser.Email ? tkUser.Email.split('@')[0] : 'Khách Hàng');
        const createKh = await pool.request()
            .input('MaTK', sql.Int, maTK)
            .input('HoTen', sql.NVarChar(100), userName)
            .input('Email', sql.VarChar(100), tkUser.Email || '')
            .input('SoDienThoai', sql.VarChar(20), tkUser.SoDienThoai || '')
            .query('INSERT INTO KhachHang (MaTK, HoTen, Email, SoDienThoai, NgayTao) OUTPUT INSERTED.MaKH VALUES (@MaTK, @HoTen, @Email, @SoDienThoai, GETDATE())');
        realMaKH = createKh.recordset[0].MaKH;
    } else {
        realMaKH = khResult.recordset[0].MaKH;
    }

    let finalMaDC;
    if (!maDC) {
        const storeAddrResult = await pool.request()
            .input('MaKH', sql.Int, realMaKH)
            .query(`
                INSERT INTO SoDiaChi (MaKH, HoTen, SoDienThoai, DiaChiChiTiet, MacDinh)
                OUTPUT INSERTED.MaDC
                VALUES (@MaKH, N'Nhận tại cửa hàng', '1900 1234', N'123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh', 0)
            `);
        finalMaDC = storeAddrResult.recordset[0].MaDC;
    } else {
        const dcResult = await pool.request()
          .input('MaDC', sql.Int, maDC).input('MaKH', sql.Int, realMaKH)
          .query('SELECT MaDC FROM SoDiaChi WHERE MaDC = @MaDC AND MaKH = @MaKH');
        if (dcResult.recordset.length === 0) return res.status(403).json({ message: "Địa chỉ không hợp lệ" });
        finalMaDC = maDC;
    }

    // 1. TỰ ĐỘNG LẤY GIỎ HÀNG TỪ REDIS VÀ TÍNH TOÁN LẠI GIÁ (Fallback sang cartItems nếu Redis trống)
    const redisKey = `cart:${realMaKH}`;
    const cartData = await redisClient.get(redisKey);
    let cart = cartData ? JSON.parse(cartData) : [];

    if (cart.length === 0 && Array.isArray(cartItems) && cartItems.length > 0) {
        cart = cartItems.map(item => ({
            maSP: Number(item.id || item.maSP),
            soLuong: Number(item.quantity) || 1
        }));
    }

    if (cart.length === 0) return res.status(400).json({ message: "Giỏ hàng đang trống" });

    // Lấy chi tiết thông tin SP từ Database để đảm bảo an toàn
    const productIds = cart.map(item => Number(item.maSP)).filter(Boolean).join(',');
    const productsQuery = await pool.request().query(`
        SELECT MaSP, TenSP, DonGia, GiaGoc, GiamToiDa, TuDongGiamGia, SoLuongTon
        FROM SanPham WHERE MaSP IN (${productIds || 0})
    `);

    let calculatedSubTotal = 0; 
    const calculatedItems = [];
    
    for (const item of cart) {
        // Tìm thông tin SP tương ứng
        const dbProduct = productsQuery.recordset.find(p => Number(p.MaSP) === Number(item.maSP));
        if (!dbProduct) return res.status(400).json({ message: "Có sản phẩm không tồn tại trong hệ thống" });

        if (item.soLuong > dbProduct.SoLuongTon) {
            return res.status(400).json({ message: `${dbProduct.TenSP} chỉ còn ${dbProduct.SoLuongTon} sản phẩm.` });
        }
        
        const finalPrice = calculatePrice(dbProduct);
        const thanhTien = item.soLuong * finalPrice;
        calculatedSubTotal += thanhTien; 
        
        calculatedItems.push(
            `(@MaDH, ${item.maSP}, ${item.soLuong}, ${finalPrice}, ${thanhTien})`
        );
    }

    const actualShippingFee = tongTien - calculatedSubTotal;
    const valuesCTDH = calculatedItems.join(', ');

    const resultUser = await pool.request()
      .input('MaKH', sql.Int, realMaKH)
      .input("MaDC", sql.Int, finalMaDC)
      .input('PhiVanChuyen', sql.Decimal(18,2), actualShippingFee) 
      .input('TongTien', sql.Decimal(18,2), tongTien)
      .input('TrangThaiDH', sql.NVarChar(50), ttDH)
      .input('TrangThaiTT', sql.NVarChar(50), ttTT)
      .query(`
        BEGIN TRAN;
        BEGIN TRY
            DECLARE @MaDH INT;
            
            INSERT INTO DonHang (MaKH, MaDC, NgayDat, PhiVanChuyen, TongTien, TrangThaiDonHang, TrangThaiThanhToan) 
            VALUES (@MaKH, @MaDC, GETDATE(), @PhiVanChuyen, @TongTien, @TrangThaiDH, @TrangThaiTT);
            SET @MaDH = SCOPE_IDENTITY();
            
            INSERT INTO ChiTietDonHang (MaDH, MaSP, SoLuong, DonGia, ThanhTien) VALUES ${valuesCTDH};
            
            -- ĐÃ XÓA LỆNH DELETE GIOHANG TỪ SQL Ở ĐÂY VÌ ĐANG DÙNG REDIS
            
            COMMIT TRAN;
            SELECT @MaDH AS maDH;
        END TRY
        BEGIN CATCH ROLLBACK TRAN; THROW; END CATCH
      `);

    // Xóa giỏ hàng trong Redis sau khi chốt đơn xong
    await redisClient.del(redisKey);

    const maDH = (resultUser && resultUser.recordset && resultUser.recordset[0]) ? (resultUser.recordset[0].maDH || resultUser.recordset[0].MaDH) : null;
    
    if (maTK) {
        try {
            await notificationModel.createNotification(
                maTK,
                'order',
                'Tạo đơn hàng thành công 📦',
                `Đơn hàng #${maDH} đã được tạo thành công với tổng tiền ${Number(tongTien || 0).toLocaleString('vi-VN')}đ và đang chờ admin duyệt.`
            );
        } catch (notifErr) {
            console.error("Lỗi tạo thông báo đơn hàng mới:", notifErr);
        }
    }

    return res.json({ message: "Chốt đơn thành công!", maDH });
  } catch (error) {
    console.error("Lỗi khi chốt đơn:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi thanh toán", error: error.message });
  }
};

// 3. Thêm một sản phẩm vào giỏ
const addToCart = async (req, res) => {
  try {
    const { maKH: maTK, maSP, soLuong } = req.body;
    const pool = await connectDB();

    // 1. Lấy mã Khách Hàng thật từ mã Tài Khoản
    const khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');

    if (khResult.recordset.length === 0) {
        return res.status(200).json({ message: "Sản phẩm được lưu giỏ hàng local" });
    }
    const realMaKH = khResult.recordset[0].MaKH;

    // 2. Thao tác với Redis
    const redisKey = `cart:${realMaKH}`;
    let cartData = await redisClient.get(redisKey);
    let cart = cartData ? JSON.parse(cartData) : [];

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const targetSP = Number(maSP);
    const existingItemIndex = cart.findIndex(item => Number(item.maSP) === targetSP);
    
    if (existingItemIndex !== -1) {
        // Cập nhật số lượng
        cart[existingItemIndex].soLuong += (Number(soLuong) || 1);
        if (cart[existingItemIndex].soLuong <= 0) cart[existingItemIndex].soLuong = 1;
    } else {
        // Thêm mới
        cart.push({ maSP: targetSP, soLuong: Number(soLuong) || 1 });
    }

    // 3. Lưu lại vào Redis
    await redisClient.setEx(redisKey, 259200, JSON.stringify(cart));

    res.status(200).json({ message: "Đã thêm vào giỏ hàng" });
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng Redis:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 4. Đồng bộ (Gộp) giỏ hàng LocalStorage vào Redis
const mergeCart = async (req, res) => {
  try {
    const { maKH: maTK, localCart } = req.body;
    
    if (!localCart || !Array.isArray(localCart) || localCart.length === 0) {
      return res.status(200).json({ message: "Không có giỏ hàng tạm để đồng bộ" });
    }

    const pool = await connectDB();

    const khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');

    if (khResult.recordset.length === 0) {
        return res.status(200).json({ message: "Tài khoản Admin không cần đồng bộ giỏ hàng" });
    }
    const realMaKH = khResult.recordset[0].MaKH;

    const redisKey = `cart:${realMaKH}`;
    let cartData = await redisClient.get(redisKey);
    let cart = cartData ? JSON.parse(cartData) : [];

    // Gộp từng sản phẩm từ localCart vào cart trên Redis
    for (let localItem of localCart) {
      const realSP = Number(localItem.maSP || localItem.id); 
      if (!realSP) continue;
      const qty = Number(localItem.quantity) || 1;

      const existingItemIndex = cart.findIndex(item => Number(item.maSP) === realSP);
      
      if (existingItemIndex !== -1) {
          cart[existingItemIndex].soLuong = Math.max(Number(cart[existingItemIndex].soLuong) || 1, qty);
      } else {
          cart.push({ maSP: realSP, soLuong: qty });
      }
    }

    await redisClient.setEx(redisKey, 259200, JSON.stringify(cart));

    res.status(200).json({ message: "Đồng bộ giỏ hàng thành công!" });
  } catch (error) {
    console.error("Lỗi đồng bộ giỏ hàng Redis:", error);
    res.status(500).json({ message: "Lỗi server khi đồng bộ" });
  }
};

// 5. HÀM XÓA SẢN PHẨM KHỎI GIỎ HÀNG
const removeFromCart = async (req, res) => {
  try {
    const { maKH: maTK, maSP } = req.params;
    const pool = await connectDB();

    const khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');

    if (khResult.recordset.length === 0) {
        return res.status(400).json({ message: "Tài khoản không hợp lệ" });
    }
    const realMaKH = khResult.recordset[0].MaKH;

    // Lấy giỏ hàng từ Redis
    const redisKey = `cart:${realMaKH}`;
    let cartData = await redisClient.get(redisKey);
    
    if (cartData) {
        let cart = JSON.parse(cartData);
        // Lọc bỏ sản phẩm cần xóa (so sánh bằng Number để tránh khác kiểu dữ liệu string/number)
        cart = cart.filter(item => Number(item.maSP) !== Number(maSP));
        
        if (cart.length > 0) {
            // Nếu giỏ hàng còn đồ, cập nhật lại Redis (set lại TTL 3 ngày)
            await redisClient.setEx(redisKey, 259200, JSON.stringify(cart));
        } else {
            // Nếu xóa xong mà giỏ hàng trống, xóa luôn key khỏi Redis cho nhẹ máy
            await redisClient.del(redisKey);
        }
    }

    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm Redis:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// 6. HÀM XÓA SẠCH GIỎ HÀNG
const clearCart = async (req, res) => {
  try {
    const maTK = req.params.maKH;
    const pool = await connectDB();

    const khResult = await pool.request()
      .input('MaTK', sql.Int, maTK)
      .query('SELECT MaKH FROM KhachHang WHERE MaTK = @MaTK');

    if (khResult.recordset.length > 0) {
      const realMaKH = khResult.recordset[0].MaKH;
      const redisKey = `cart:${realMaKH}`;
      await redisClient.del(redisKey);
    }

    res.status(200).json({ message: "Đã xóa sạch giỏ hàng" });
  } catch (error) {
    console.error("Lỗi khi xóa sạch giỏ hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getCartByCustomerId,
  checkoutCart,
  addToCart,
  mergeCart,
  removeFromCart,
  clearCart
};