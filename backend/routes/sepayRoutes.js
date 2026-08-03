const express = require('express');
const router = express.Router();
const { sepayWebhook } = require('../controllers/sepayController');

router.post('/webhook', sepayWebhook);

module.exports = router;