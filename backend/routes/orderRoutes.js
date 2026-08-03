const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/user/:maTK", orderController.getOrdersByUser);
router.get("/:id/payment-status", orderController.getPaymentStatus); // THÊM DÒNG NÀY
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderDetail);
router.put("/:id/status", orderController.updateStatus);

module.exports = router;