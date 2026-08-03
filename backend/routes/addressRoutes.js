const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");

// GET
router.get("/:maTK", addressController.getAddresses);

router.post("/", addressController.addAddress);

router.put("/set-default", addressController.setDefault);

module.exports = router;