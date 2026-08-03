const orderModel = require("../models/orderModel");
const notificationModel = require("../models/notificationModel"); 
const { connectDB, sql } = require("../config/db"); // THÊM DÒNG NÀY ĐỂ KẾT NỐI DB TÌM MaTK

const getAllOrders = async (req, res) => {
    try {
        // Lấy các tham số lọc từ req.query
        const { status, fromDate, toDate } = req.query;
        
        // Truyền xuống model
        const orders = await orderModel.getAllOrders(status, fromDate, toDate);
        res.status(200).json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Lỗi server"
        });
    }
};

const getOrderDetail = async (req,res)=>{
    try{
        const detail = await orderModel.getOrderDetail(req.params.id);
        res.json(detail);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};

const updateStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.TrangThaiDonHang;
        const newPaymentStatus = req.body.TrangThaiThanhToan; // Lấy thêm trạng thái thanh toán

        // 1. Lấy trạng thái hiện tại của đơn hàng từ Database
        const currentOrder = await orderModel.getOrderStatusById(orderId);
        
        // Cập nhật điều kiện: Không cho hủy nếu TRẠNG THÁI HIỆN TẠI ĐÃ LÀ THANH TOÁN
        if (
            newStatus === "Đã hủy" &&
            currentOrder.TrangThaiThanhToan === "Đã thanh toán"
        ) {
            return res.status(400).json({
                message: "Đơn hàng đã thanh toán không thể hủy."
            });
        }
        if (!currentOrder) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
        }

        const currentStatus = currentOrder.TrangThaiDonHang;

        // 2. Khai báo luồng trạng thái
        const allowedTransitions = {
            "Chờ xác nhận": ["Chờ xác nhận", "Đã xác nhận", "Đã hủy"],
            "Đã xác nhận": ["Đã xác nhận", "Đang giao", "Đã hủy"],
            "Đang giao": ["Đang giao", "Đã giao", "Đã hủy"],
            "Đã giao": ["Đã giao"], 
            "Đã hủy": ["Đã hủy"]    
        };

        // 3. Kiểm tra tính hợp lệ của thao tác chuyển đổi
        const validOptions = allowedTransitions[currentStatus] || [currentStatus];
        
        if (!validOptions.includes(newStatus)) {
            return res.status(400).json({ 
                message: `Lỗi thao tác: Không thể chuyển trạng thái đơn hàng từ '${currentStatus}' sang '${newStatus}'` 
            });
        }

        // 4. Cập nhật trạng thái (Bao gồm cả trạng thái giao hàng & thanh toán)
        await orderModel.updateStatus(orderId, newStatus, newPaymentStatus);
        
        // --- 5. TẠO THÔNG BÁO TỰ ĐỘNG ---
        try {
            const pool = await connectDB();
            
            // TRUY VẤN TÌM CHÍNH XÁC MaTK CỦA NGƯỜI ĐẶT ĐƠN HÀNG NÀY
            const userResult = await pool.request()
                .input('MaDH', sql.Int, orderId)
                .query(`
                    SELECT kh.MaTK 
                    FROM DonHang dh
                    JOIN KhachHang kh ON dh.MaKH = kh.MaKH
                    WHERE dh.MaDH = @MaDH
                `);

            if (userResult.recordset.length > 0) {
                const maTK = userResult.recordset[0].MaTK; 
                let title = "";
                let content = "";

                if (newStatus === "Đã hủy" && currentStatus !== "Đã hủy") {
                    title = "Đơn hàng đã bị hủy ❌";
                    content = `Đơn hàng #${orderId} của bạn đã được hủy thành công.`;
                } else if (newStatus === "Đã xác nhận" && currentStatus !== "Đã xác nhận") {
                    title = "Đơn hàng đã được xác nhận ✅";
                    content = `Đơn hàng #${orderId} của bạn đã được cửa hàng xác nhận và đang đóng gói.`;
                } else if (newStatus === "Đang giao" && currentStatus !== "Đang giao") {
                    title = "Đơn hàng đang được giao 🚚";
                    content = `Đơn hàng #${orderId} của bạn đang trên đường giao đến. Vui lòng chú ý điện thoại để nhận hàng nhé.`;
                } else if (newStatus === "Đã giao" && currentStatus !== "Đã giao") {
                    title = "Giao hàng thành công 🎉";
                    content = `Đơn hàng #${orderId} đã được giao thành công. Cảm ơn bạn đã tin tưởng và mua sắm!`;
                }

                if (title !== "") {
                    await notificationModel.createNotification(maTK, 'order', title, content);
                }
            }
        } catch (notifyErr) {
            console.error("Lỗi tạo thông báo trạng thái đơn hàng:", notifyErr);
        }
        // ---------------------------------

        res.json({ message: "Cập nhật thành công" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật trạng thái" });
    }
};

const getOrdersByUser = async (req, res) => {
    try {
        const orders = await orderModel.getOrdersByUser(req.params.maTK);
        res.status(200).json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const data = await orderModel.getPaymentStatusById(req.params.id);
        res.json(data || { TrangThaiThanhToan: null });
    } catch (error) {
        console.error("Lỗi lấy trạng thái thanh toán:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports={
    getAllOrders,
    getOrderDetail,
    updateStatus,
    getOrdersByUser,
    getPaymentStatus
}