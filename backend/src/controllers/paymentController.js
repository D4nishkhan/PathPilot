const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { Subscription } = require('../models/Badge');

// BUG-01 FIX: Lazily create Razorpay instance only when keys are available
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Plans config
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 AI Roadmap', '3 Learning Tracks', '10 AI messages/day', 'Basic Analytics'],
    limits: { roadmaps: 1, tracks: 3, aiMessages: 10 },
  },
  premium: {
    name: 'Premium',
    price: 49900, // paise = ₹499
    features: ['Unlimited Roadmaps', 'All Tracks', 'Unlimited AI Tutor', 'Mock Interviews', 'Advanced Analytics', 'Priority Support'],
    limits: { roadmaps: -1, tracks: -1, aiMessages: -1 },
  },
};

// @desc    Get plans info
// @route   GET /api/payments/plans
// @access  Public
const getPlans = (req, res) => {
  res.json({ success: true, plans: PLANS });
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.',
        code: 'PAYMENT_NOT_CONFIGURED',
      });
    }

    const { plan } = req.body;
    if (plan !== 'premium') {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const amount = PLANS[plan].price;
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), plan },
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured.', code: 'PAYMENT_NOT_CONFIGURED' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update user plan (30 days premium)
    const planExpiry = new Date();
    planExpiry.setDate(planExpiry.getDate() + 30);

    await User.findByIdAndUpdate(req.user._id, {
      plan: 'premium',
      planExpiry,
    });

    // Update or create subscription
    await Subscription.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        plan: 'premium',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'active',
        startDate: new Date(),
        endDate: planExpiry,
        amount: PLANS.premium.price,
        $push: {
          paymentHistory: {
            paymentId: razorpay_payment_id,
            amount: PLANS.premium.price,
            date: new Date(),
            status: 'success',
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Payment verified! Premium activated.', planExpiry });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, createOrder, verifyPayment };
