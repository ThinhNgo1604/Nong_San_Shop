const categoryModel = require("../models/categoryModel");


// GET tất cả danh mục
const getAllCategories = async (req, res) => {

    try {

        const categories = await categoryModel.getAllCategories();

        res.status(200).json(categories);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi máy chủ"
        });

    }

};

// POST
const createCategory = async (req, res) => {

    try {

        const { TenDM, MoTa } = req.body;

        // Validate tên danh mục
        if (!TenDM || !TenDM.trim()) {
            return res.status(400).json({
                message: "Tên danh mục không được để trống."
            });
        }

        if (TenDM.trim().length < 2) {
            return res.status(400).json({
                message: "Tên danh mục phải có ít nhất 2 ký tự."
            });
        }

        if (TenDM.trim().length > 100) {
            return res.status(400).json({
                message: "Tên danh mục không được vượt quá 100 ký tự."
            });
        }

        // Validate mô tả
        if (MoTa && MoTa.length > 255) {
            return res.status(400).json({
                message: "Mô tả tối đa 255 ký tự."
            });
        }
        const exists = await categoryModel.checkCategoryName(TenDM.trim());

        if (exists) {
            return res.status(400).json({
                message: "Tên danh mục đã tồn tại."
            });
        }
        await categoryModel.createCategory({
            TenDM: TenDM.trim(),
            MoTa: MoTa?.trim()
        });

        res.status(201).json({
            message: "Thêm danh mục thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi máy chủ"
        });

    }

};

// PUT
const updateCategory = async (req, res) => {

    try {

        const { TenDM, MoTa } = req.body;

        if (!TenDM || !TenDM.trim()) {
            return res.status(400).json({
                message: "Tên danh mục không được để trống."
            });
        }

        if (TenDM.trim().length < 2) {
            return res.status(400).json({
                message: "Tên danh mục phải có ít nhất 2 ký tự."
            });
        }

        if (TenDM.trim().length > 100) {
            return res.status(400).json({
                message: "Tên danh mục không được vượt quá 100 ký tự."
            });
        }

        if (MoTa && MoTa.length > 255) {
            return res.status(400).json({
                message: "Mô tả tối đa 255 ký tự."
            });
        }

        const exists = await categoryModel.checkCategoryNameUpdate(
            req.params.id,
            TenDM.trim()
        );

        if (exists) {
            return res.status(400).json({
                message: "Tên danh mục đã tồn tại."
            });
        }

        await categoryModel.updateCategory(
            req.params.id,
            {
                TenDM: TenDM.trim(),
                MoTa: MoTa?.trim()
            }
        );

        res.json({
            message: "Cập nhật thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi server"
        });

    }

};
// DELETE
const deleteCategory = async (req, res) => {

    try {

        await categoryModel.deleteCategory(req.params.id);

        res.json({
            message: "Xóa thành công"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi server"
        });

    }

};
module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};