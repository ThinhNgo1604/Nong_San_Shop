const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const upload = require("../middlewares/upload");

// CLIENT
router.get("/all", productController.getAllProductsClient);

// PRICE
router.get("/prices", productController.getAllPrices);
router.put("/prices/:id", productController.updatePrice);

// PRODUCT
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

router.post(
    "/",
    upload.single("image"),
    productController.createProduct
);

router.put(
    "/:id",
    upload.single("image"),
    productController.updateProduct
);

router.delete("/:id", productController.deleteProduct);

module.exports = router;