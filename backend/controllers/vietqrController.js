// Tạo URL ảnh QR VietQR động, nhúng MaDH vào nội dung chuyển khoản để đối chiếu khi webhook báo về
const createVietQrPayment = (req, res) => {
    try {
        const { amount, maDH } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Số tiền không hợp lệ" });
        }
        if (!maDH) {
            return res.status(400).json({ message: "Thiếu mã đơn hàng (maDH)" });
        }

        const bankCode = process.env.VIETQR_BANK_CODE;
        const accountNo = process.env.VIETQR_ACCOUNT_NO;
        const accountName = process.env.VIETQR_ACCOUNT_NAME;

        if (!bankCode || !accountNo) {
            return res.status(500).json({ message: "Chưa cấu hình tài khoản nhận tiền VietQR" });
        }

        // Nội dung chuyển khoản chứa "DH{maDH}" để webhook SePay đối chiếu đúng đơn hàng
        const content = `DH${maDH} thanh toan don hang`;

        const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png` +
            `?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName || '')}`;

        res.json({ qrUrl, content, accountNo, bankCode, accountName });
    } catch (error) {
        console.error("Lỗi tạo VietQR:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tạo mã VietQR" });
    }
};

module.exports = { createVietQrPayment };