const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Protect route - require authentication
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

// Premium only
const premiumOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  const isAdmin = req.user.role === 'admin';
  // planExpiry === null means lifetime/no-expiry premium (admin-granted).
  // Only enforce expiry when planExpiry is explicitly set.
  const hasActivePremium =
    req.user.plan === 'premium' &&
    (req.user.planExpiry == null || req.user.planExpiry > new Date());

  if (!hasActivePremium && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required.',
      code: 'UPGRADE_REQUIRED',
    });
  }
  next();
};

module.exports = { protect, adminOnly, premiumOnly, generateToken };