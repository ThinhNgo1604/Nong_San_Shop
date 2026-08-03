const express = require("express");

const router = express.Router();

const reportController = require("../controllers/reportController");

router.get("/", reportController.getDashboardReport);

router.get("/chart", reportController.getRevenueChart);

router.get("/top-products", reportController.getTopProducts);
module.exports = router;