const crypto = require("crypto");
const orderModel = require("../models/orderModel");

const PARTNER_CODE = process.env.MOMO_PARTNER_CODE;
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY;
const SECRET_KEY = process.env.MOMO_SECRET_KEY;
const ENDPOINT = process.env.MOMO_ENDPOINT;
const REDIRECT_URL = process.env.MOMO_REDIRECT_URL;
const IPN_URL = process.env.MOMO_IPN_URL;
const QUERY_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/query";

// Tạo chữ ký HMAC_SHA256 theo đúng thứ tự MoMo yêu cầu
function buildSignature(rawData) {
    return crypto.createHmac("sha256", SECRET_KEY).update(rawData).digest("hex");
}

// Tách MaDH ra từ orderId dạng "DH{maDH}_{timestamp}"
function extractMaDH(orderId) {
    const match = String(orderId).match(/^DH(\d+)_/);
    return match ? parseInt(match[1]) : null;
}

// 1. Tạo giao dịch thanh toán MoMo -> trả về payUrl để redirect khách sang MoMo
const createMomoPayment = async (req, res) => {
    try {
        const { amount, orderInfo, maDH } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Số tiền không hợp lệ" });
        }
        if (!maDH) {
            return res.status(400).json({ message: "Thiếu mã đơn hàng (maDH)" });
        }

        const requestId = `${PARTNER_CODE}_${Date.now()}`;
        // Nhúng MaDH vào orderId để IPN/checkStatus lấy lại được đơn hàng cần cập nhật
        const orderId = `DH${maDH}_${Date.now()}`;
        const requestType = "captureWallet";
        const extraData = "";

        const rawSignature =
            `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
            `&ipnUrl=${IPN_URL}&orderId=${orderId}&orderInfo=${orderInfo}` +
            `&partnerCode=${PARTNER_CODE}&redirectUrl=${REDIRECT_URL}` +
            `&requestId=${requestId}&requestType=${requestType}`;

        const signature = buildSignature(rawSignature);

        const body = {
            partnerCode: PARTNER_CODE,
            accessKey: ACCESS_KEY,
            requestId,
            amount: String(amount),
            orderId,
            orderInfo,
            redirectUrl: REDIRECT_URL,
            ipnUrl: IPN_URL,
            requestType,
            extraData,
            lang: "vi",
            signature,
        };

        const momoRes = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await momoRes.json();

        if (data.resultCode !== 0) {
            console.error("MoMo tạo giao dịch thất bại:", data);
            return res.status(400).json({ message: data.message || "Không thể tạo giao dịch MoMo" });
        }

        // Trả về payUrl (link thanh toán web) và orderId (để FE lưu lại, dùng kiểm tra trạng thái sau)
        res.json({
            payUrl: data.payUrl,
            qrCodeUrl: data.qrCodeUrl,
            orderId,
            requestId,
        });

    } catch (error) {
        console.error("Lỗi tạo thanh toán MoMo:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tạo thanh toán MoMo" });
    }
};

// 2. Kiểm tra trạng thái giao dịch (dùng cho trang momo-return, vì IPN không gọi được về localhost khi dev)
const checkMomoStatus = async (req, res) => {
    try {
        const { orderId, requestId } = req.body;

        if (!orderId || !requestId) {
            return res.status(400).json({ message: "Thiếu orderId hoặc requestId" });
        }

        const rawSignature =
            `accessKey=${ACCESS_KEY}&orderId=${orderId}&partnerCode=${PARTNER_CODE}&requestId=${requestId}`;

        const signature = buildSignature(rawSignature);

        const body = {
            partnerCode: PARTNER_CODE,
            requestId,
            orderId,
            signature,
            lang: "vi",
        };

        const momoRes = await fetch(QUERY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await momoRes.json();
        const paid = data.resultCode === 0;

        // Nếu thanh toán thành công -> cập nhật luôn trạng thái đơn hàng trong DB
        if (paid) {
            const maDH = extractMaDH(orderId);
            if (maDH) {
                await orderModel.updatePaymentStatus(maDH, "Đã thanh toán");
            }
        }

        res.json({
            paid,
            resultCode: data.resultCode,
            message: data.message,
        });

    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái MoMo:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra thanh toán" });
    }
};

// 3. Xác minh chữ ký của dữ liệu MoMo gửi về qua IPN
function verifyMomoSignature(data) {
    const {
        partnerCode, orderId, requestId, amount, orderInfo, orderType,
        transId, resultCode, message, payType, responseTime, extraData, signature
    } = data;

    const rawSignature =
        `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
        `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}` +
        `&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}` +
        `&requestId=${requestId}&responseTime=${responseTime}` +
        `&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = buildSignature(rawSignature);
    return expectedSignature === signature;
}

// 4. Nhận IPN (webhook) từ server MoMo - nguồn xác nhận thanh toán đáng tin cậy nhất
const momoIPN = async (req, res) => {
    try {
        if (!verifyMomoSignature(req.body)) {
            console.error("IPN MoMo: chữ ký không hợp lệ", req.body);
            return res.status(400).json({ message: "Sai chữ ký" });
        }

        const { orderId, resultCode } = req.body;
        const maDH = extractMaDH(orderId);

        if (!maDH) {
            console.error("IPN MoMo: không đọc được MaDH từ orderId", orderId);
            return res.status(400).json({ message: "orderId không hợp lệ" });
        }

        if (resultCode === 0) {
            await orderModel.updatePaymentStatus(maDH, "Đã thanh toán");
        }

        // MoMo chỉ cần nhận response 204/200, không cần body
        res.status(204).send();
    } catch (error) {
        console.error("Lỗi xử lý IPN MoMo:", error);
        res.status(500).send();
    }
};

module.exports = { createMomoPayment, checkMomoStatus, momoIPN };