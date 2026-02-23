/**
 * routes/webhooks.js
 */

const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');

// Note: Raw body parsing is applied to /api/webhooks in server.js
// DO NOT add verifyAdmin here — webhooks come directly from Razorpay
router.post('/razorpay', handleRazorpayWebhook);

module.exports = router;
