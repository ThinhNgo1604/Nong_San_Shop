const express = require('express');
const router = express.Router();
const { createVietQrPayment } = require('../controllers/vietqrController');

router.post('/create', createVietQrPayment);

module.exports = router;