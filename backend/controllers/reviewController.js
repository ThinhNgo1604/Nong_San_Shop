const reviewModel = require("../models/reviewModel");

const getByProduct = async (req, res) => {
    try {
        const reviews = await reviewModel.getReviewsByProduct(req.params.maSP);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

const getByUser = async (req, res) => {
    try {
        const reviews = await reviewModel.getReviewsByUser(req.params.maTK);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

const checkEligibility = async (req, res) => {
    try {
        const { maTK, maSP } = req.params;
        const canReview = await reviewModel.checkCanReview(maTK, maSP);
        res.json({ canReview });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

const addReview = async (req, res) => {
    try {
        const { maTK, maSP, soSao, noiDung } = req.body;
        
        const canReview = await reviewModel.checkCanReview(maTK, maSP);
        if (!canReview) {
            return res.status(403).json({ message: "Bạn phải mua sản phẩm này mới được đánh giá." });
        }

        await reviewModel.createReview(maTK, maSP, soSao, noiDung);
        res.status(201).json({ message: "Đánh giá thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

module.exports = { getByProduct, getByUser, checkEligibility, addReview };