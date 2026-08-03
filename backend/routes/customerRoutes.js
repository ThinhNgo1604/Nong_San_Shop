const express = require("express");

const router = express.Router();

const customerController = require("../controllers/customerController");

router.get("/", customerController.getAllCustomers);
router.put("/:id/status", customerController.updateStatus);

module.exports = router;