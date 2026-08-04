const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");

// GET danh sách địa chỉ
router.get("/:maTK", addressController.getAddresses);

// POST thêm địa chỉ mới
router.post("/", addressController.addAddress);

// PUT đặt địa chỉ mặc định
router.put("/set-default", addressController.setDefault);

// PUT sửa địa chỉ
router.put("/:maDC", addressController.updateAddress);

// DELETE xóa địa chỉ
router.delete("/:maDC", addressController.deleteAddress);

module.exports = router;
