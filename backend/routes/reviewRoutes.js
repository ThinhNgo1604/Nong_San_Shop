const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

router.get("/product/:maSP", reviewController.getByProduct);

router.get("/user/:maTK", reviewController.getByUser);

router.get("/check/:maTK/:maSP", reviewController.checkEligibility);

router.post("/", reviewController.addReview);

module.exports = router;