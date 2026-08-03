const express = require('express');
const router = express.Router();
const { createMomoPayment, checkMomoStatus, momoIPN } = require('../controllers/momoController');

router.post('/create', createMomoPayment);
router.post('/check-status', checkMomoStatus);
router.post('/ipn', momoIPN); // route MoMo server gọi thẳng về, không qua trình duyệt

module.exports = router;