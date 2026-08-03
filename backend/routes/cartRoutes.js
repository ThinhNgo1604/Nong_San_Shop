const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// GET
router.post('/merge', cartController.mergeCart);

router.get('/:maKH', cartController.getCartByCustomerId);

router.post('/checkout', cartController.checkoutCart);

router.delete('/remove/:maKH/:maSP', cartController.removeFromCart);

router.post('/add', cartController.addToCart);

module.exports = router;