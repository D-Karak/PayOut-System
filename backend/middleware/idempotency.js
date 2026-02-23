/**
 * middleware/idempotency.js — Idempotency Key Enforcement
 *
 * Ensures payout requests with the same X-Idempotency-Key header
 * are deduplicated — critical for preventing double-spending.
 */

const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

const idempotencyCheck = async (req, res, next) => {
    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
        return res.status(400).json({
            success: false,
            message: 'X-Idempotency-Key header is required for payout requests.'
        });
    }

    // Validate key format (UUID v4 preferred)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
        return res.status(400).json({
            success: false,
            message: 'X-Idempotency-Key must be a valid UUID v4 format.'
        });
    }

    try {
        // Check if this key was already used
        const existingTransaction = await Transaction.findOne({ idempotencyKey })
            .populate('beneficiary', 'name email');

        if (existingTransaction) {
            logger.warn(`Duplicate payout request detected. Key: ${idempotencyKey}`);
            return res.status(200).json({
                success: true,
                duplicate: true,
                message: 'Duplicate request detected. Returning original transaction result.',
                transaction: existingTransaction
            });
        }

        // Attach key to request for controller use
        req.idempotencyKey = idempotencyKey;
        next();

    } catch (error) {
        logger.error(`Idempotency check error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Idempotency check failed due to a server error.'
        });
    }
};

module.exports = idempotencyCheck;
