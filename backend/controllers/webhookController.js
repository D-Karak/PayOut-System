/**
 * controllers/webhookController.js — RazorpayX Webhook Handler
 *
 * Handles: payout.processed, payout.failed, payout.reversed, payout.queued
 * Security: Verifies Razorpay-Signature header before processing
 */

const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// ─── Signature Verification ───────────────────────────────────────────
const verifyWebhookSignature = (rawBody, receivedSignature, secret) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
    );
};

// ─── POST /api/webhooks/razorpay ─────────────────────────────────────
exports.handleRazorpayWebhook = async (req, res) => {
    try {
        // 1. Get raw body (must use express.raw middleware before this)
        const rawBody = req.body; // Buffer
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            logger.warn('Webhook received without signature header');
            return res.status(400).json({ success: false, message: 'Missing signature.' });
        }

        // 2. Verify signature
        const isValid = verifyWebhookSignature(rawBody, signature, secret);
        if (!isValid) {
            logger.warn('❌ Webhook signature verification FAILED');
            return res.status(401).json({ success: false, message: 'Invalid signature.' });
        }

        // 3. Parse event payload
        const event = JSON.parse(rawBody.toString());
        const eventType = event.event;
        const payload = event.payload?.payout?.entity;

        logger.info(`📬 Webhook received: ${eventType} | Payout ID: ${payload?.id}`);

        if (!payload) {
            return res.status(200).json({ success: true, message: 'Webhook acknowledged (no payload).' });
        }

        // 4. Find the transaction by RazorpayX payout ID
        const transaction = await Transaction.findOne({ razorpayPayoutId: payload.id });

        if (!transaction) {
            // Could be a payout not initiated through our system
            logger.warn(`⚠️  Webhook for unknown payout: ${payload.id}`);
            return res.status(200).json({ success: true, message: 'Webhook acknowledged (transaction not found).' });
        }

        // 5. Update transaction based on event type
        switch (eventType) {
            case 'payout.processed':
                transaction.status = 'processed';
                transaction.utr = payload.utr || null;
                transaction.processedAt = new Date(payload.processed_at * 1000);
                transaction.failureReason = null;
                logger.info(`✅ Payout PROCESSED: ${payload.id} | UTR: ${payload.utr}`);
                break;

            case 'payout.failed':
                transaction.status = 'failed';
                transaction.failureReason = payload.error?.description || payload.failure_reason || 'Payout failed';
                transaction.failedAt = new Date();
                logger.error(`❌ Payout FAILED: ${payload.id} | Reason: ${transaction.failureReason}`);
                break;

            case 'payout.reversed':
                transaction.status = 'reversed';
                logger.warn(`🔄 Payout REVERSED: ${payload.id}`);
                break;

            case 'payout.queued':
                transaction.status = 'queued';
                transaction.queuedAt = new Date();
                logger.info(`⏳ Payout QUEUED: ${payload.id}`);
                break;

            case 'payout.pending':
                transaction.status = 'pending';
                logger.info(`⏰ Payout PENDING: ${payload.id}`);
                break;

            default:
                logger.info(`Unhandled webhook event: ${eventType}`);
        }

        // 6. Store raw webhook payload for audit
        transaction.webhookPayload = event;
        await transaction.save();

        res.status(200).json({ success: true, message: `Webhook ${eventType} processed.` });

    } catch (error) {
        logger.error(`Webhook handler error: ${error.message}`, { stack: error.stack });
        // Always return 200 to Razorpay to prevent retries on our faults
        res.status(200).json({ success: false, message: 'Webhook processing error (logged).' });
    }
};
