/**
 * routes/payouts.js
 */

const express = require('express');
const router = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');
const ipWhitelist = require('../middleware/ipWhitelist');
const idempotencyCheck = require('../middleware/idempotency');
const {
    initiatePayout,
    getPayoutHistory,
    getPayoutById,
    getDashboardStats
} = require('../controllers/payoutController');

// All payout routes require admin auth + IP whitelist
router.use(verifyAdmin, ipWhitelist);

// Dashboard stats (no idempotency required)
router.get('/stats/dashboard', getDashboardStats);

// Payout history
router.get('/', getPayoutHistory);

// Get single payout
router.get('/:id', getPayoutById);

// Initiate payout — enforces idempotency key
router.post('/', idempotencyCheck, initiatePayout);

module.exports = router;
