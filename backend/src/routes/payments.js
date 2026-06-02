const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPlans, createOrder, verifyPayment } = require('../controllers/paymentController');

router.get('/plans', getPlans);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
