const voucherModel = require("../models/voucherModel");
const notificationModel = require("../models/notificationModel");
const { connectDB, sql } = require("../config/db");

// Lấy danh sách (Admin)
const getAll = async (req, res) => {
    try {
        const vouchers = await voucherModel.getAllVoucher();
        res.status(200).json(vouchers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Lấy danh sách (Khách hàng)
const getActive = async (req, res) => {
    try {
        const vouchers = await voucherModel.getActiveVouchers();
        res.status(200).json(vouchers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Thêm Voucher
const create = async (req, res) => {
    try{
        if(await voucherModel.checkCodeExists(req.body.Code)){
            return res.status(400).json({ message:"Mã giảm giá đã tồn tại." });
        }

        await voucherModel.createVoucher(req.body);

        // --- TẠO THÔNG BÁO CHO TẤT CẢ KHÁCH HÀNG ---
        try {
            const pool = await connectDB();
            
            const users = await pool.request().query(`
                SELECT MaTK FROM TaiKhoan WHERE VaiTro = N'Khách hàng'
            `);

            for (let user of users.recordset) {
                await notificationModel.createNotification(
                    user.MaTK,
                    'voucher',
                    'Tặng bạn mã giảm giá mới 🎟️',
                    `Hệ thống vừa thêm mã giảm giá ${req.body.Code}. Nhanh tay lưu lại vào ví và sử dụng nhé!`
                );
            }
        } catch (notifyErr) {
            console.error("Lỗi gửi thông báo voucher:", notifyErr);
        }
        // ------------------------------------------

        res.json({ message:"Thêm thành công" });
    }catch(err){
        console.log(err);
        res.status(500).json({ message:"Lỗi server" });
    }
};

// Sửa
const update = async (req, res) => {
     try{
        if(await voucherModel.checkCodeExists(req.body.Code,req.params.id)){
            return res.status(400).json({ message:"Mã giảm giá đã tồn tại." });
        }

        await voucherModel.updateVoucher(req.params.id, req.body);
        res.json({ message:"Cập nhật thành công" });
    }catch(err){
        console.log(err);
        res.status(500).json({ message:"Lỗi server" });
    }
};

// Xóa
const remove = async (req, res) => {
    try {
        await voucherModel.deleteVoucher(req.params.id);
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

// GET /api/vouchers/redeemable - danh sách voucher đổi được + điểm hiện có
const getRedeemable = async (req, res) => {
    try {
        const { maTK } = req.user;
        const maKH = await voucherModel.getMaKHByMaTK(maTK);
 
        if (!maKH) {
            return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
        }
 
        const [vouchers, totalPoints] = await Promise.all([
            voucherModel.getRedeemableVouchers(),
            voucherModel.getTotalPoints(maKH)
        ]);
 
        res.status(200).json({ vouchers, totalPoints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi tải voucher" });
    }
};
 
// GET /api/vouchers/my-vouchers - ví voucher của khách hàng
const getMyVouchers = async (req, res) => {
    try {
        const { maTK } = req.user;
        const maKH = await voucherModel.getMaKHByMaTK(maTK);
 
        if (!maKH) {
            return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
        }
 
        const myVouchers = await voucherModel.getMyVouchers(maKH);
        res.status(200).json(myVouchers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi tải ví voucher" });
    }
};
 
// POST /api/vouchers/:id/redeem - đổi voucher bằng điểm
const redeem = async (req, res) => {
    try {
        const { maTK } = req.user;
        const maGG = Number(req.params.id);
        const maKH = await voucherModel.getMaKHByMaTK(maTK);
 
        if (!maKH) {
            return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
        }
 
        const vouchers = await voucherModel.getRedeemableVouchers();
        const voucher = vouchers.find(v => v.MaGG === maGG);
 
        if (!voucher) {
            return res.status(404).json({ message: "Voucher không tồn tại hoặc đã hết hạn/hết số lượng" });
        }
 
        const alreadyRedeemed = await voucherModel.checkAlreadyRedeemed(maKH, maGG);
        if (alreadyRedeemed) {
            return res.status(400).json({ message: "Bạn đã đổi voucher này rồi" });
        }
 
        const totalPoints = await voucherModel.getTotalPoints(maKH);
        if (totalPoints < voucher.SoDiemDoi) {
            return res.status(400).json({ message: "Bạn không đủ điểm để đổi voucher này" });
        }
 
        await voucherModel.redeemVoucher(maKH, voucher);
        const newTotalPoints = await voucherModel.getTotalPoints(maKH);
 
        res.status(200).json({ message: "Đổi voucher thành công!", totalPoints: newTotalPoints });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi đổi voucher" });
    }
};

module.exports = {
    getAll,
    getActive,
    create,
    update,
    remove,
    getRedeemable,
    getMyVouchers,
    redeem
};