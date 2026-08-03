const { GoogleGenerativeAI } = require("@google/generative-ai");
const productModel = require("../models/productModel");
const calculatePrice = require("../utils/priceCalculator");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractKeywords = (message) => {
    const stopWords = [
        "shop", "có", "không", "bán", "giá", "bao", "nhiêu", "cho", "mình",
        "tôi", "muốn", "mua", "là", "gì", "ạ", "vậy", "à", "nào", "loại",
        "như", "thế", "sao", "ra", "sao", "được", "vậy", "hả", "hử", "này"
    ];
    const cleanMessage = message.replace(/[.,?!]/g, "");

    return cleanMessage
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.includes(word))
        .join(" ");
};

const ask = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Vui lòng nhập câu hỏi" });
        }

        // 1. Tìm sản phẩm liên quan trong DB dựa theo câu hỏi
        let relatedProducts = [];
        try {
            const keyword = extractKeywords(message);
            if (keyword) {
                relatedProducts = await productModel.searchProducts(keyword, 5);
            }
        } catch (dbError) {
            console.error("Lỗi tìm sản phẩm cho chatbot:", dbError);
        }

        // 2. Tính giá thực tế + trạng thái giảm giá/tồn kho cho từng sản phẩm
        const productContext = relatedProducts.length > 0
            ? relatedProducts.map(p => {
                const finalPrice = calculatePrice(p);
                const isDiscounted = p.TuDongGiamGia && finalPrice < p.GiaGoc;

                const priceInfo = isDiscounted
                    ? `Giá gốc: ${Number(p.GiaGoc).toLocaleString()}đ, giá hiện tại: ${Number(finalPrice).toLocaleString()}đ (đang giảm ${Math.round((1 - finalPrice / p.GiaGoc) * 100)}%)`
                    : `Giá: ${Number(finalPrice).toLocaleString()}đ`;

                const stockStatus = p.SoLuongTon > 0
                    ? `Còn hàng (${p.SoLuongTon} ${p.DonViTinh})`
                    : "TẠM HẾT HÀNG";

                return `- ${p.TenSP} (Danh mục: ${p.TenDM}) - ${priceInfo}/${p.DonViTinh} - Tình trạng: ${stockStatus} - Mô tả: ${p.MoTa || "Không có mô tả"}`;
            }).join("\n")
            : "Không tìm thấy sản phẩm nào khớp trực tiếp với câu hỏi này trong kho.";

        // 3. Xây dựng system prompt cho chatbot
        const systemPrompt = `
Bạn là trợ lý ảo tư vấn bán hàng của "Nông Sản Shop" - một cửa hàng bán thực phẩm nông sản sạch trực tuyến.

Nhiệm vụ của bạn:
- Tư vấn, gợi ý sản phẩm nông sản phù hợp với nhu cầu khách hàng.
- Trả lời các câu hỏi hỗ trợ chung: cách đặt hàng, chính sách đổi trả, giao hàng, thanh toán... (trả lời chung chung, hợp lý nếu không có thông tin chính sách cụ thể).
- Luôn trả lời bằng tiếng Việt, giọng điệu thân thiện, ngắn gọn, dễ hiểu.
- Nếu khách hỏi về sản phẩm, ưu tiên dùng thông tin sản phẩm liên quan bên dưới (nếu có) để trả lời chính xác về giá, khuyến mãi, tồn kho.
- Nếu sản phẩm đang "đang giảm X%", hãy chủ động nhắc khách biết để khuyến khích mua ngay.
- Nếu sản phẩm có trong danh sách nhưng ghi "TẠM HẾT HÀNG", hãy báo khách đúng là sản phẩm đang tạm hết hàng (KHÔNG phải là sản phẩm không tồn tại), và có thể gợi ý sản phẩm khác còn hàng thay thế nếu phù hợp.
- Nếu không có sản phẩm phù hợp trong danh sách, hãy nói thật rằng cửa hàng hiện chưa có sản phẩm đó, đừng bịa ra sản phẩm không tồn tại.
- Không trả lời các câu hỏi ngoài phạm vi cửa hàng nông sản (chính trị, y tế chuyên sâu...), hãy lịch sự từ chối và hướng khách quay lại chủ đề mua sắm.

Danh sách sản phẩm liên quan tìm thấy trong kho (nếu có):
${productContext}
        `.trim();

        // 4. Ghép lịch sử hội thoại gần nhất (nếu có) để giữ ngữ cảnh
        const historyText = Array.isArray(history)
            ? history.slice(0, -1).map(h => `${h.role === "user" ? "Khách" : "Trợ lý"}: ${h.content}`).join("\n")
            : "";

        const fullPrompt = `${systemPrompt}\n\n${historyText ? "Lịch sử hội thoại:\n" + historyText + "\n\n" : ""}Câu hỏi hiện tại của khách: ${message}`;

        // 5. Gọi Gemini
        let reply;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(fullPrompt);
            reply = result.response.text();
        } catch (aiError) {
            console.error("Lỗi gọi Gemini API:", aiError?.message || aiError);
            return res.status(500).json({
                message: "Không thể kết nối tới AI. Vui lòng kiểm tra lại API key hoặc kết nối mạng."
            });
        }

        res.status(200).json({ reply });

    } catch (error) {
        console.error("Lỗi chatbot:", error?.message || error);
        res.status(500).json({ message: "Trợ lý ảo đang gặp sự cố, vui lòng thử lại sau." });
    }
};

module.exports = { ask };