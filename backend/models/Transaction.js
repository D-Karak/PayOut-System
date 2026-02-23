/**
 * models/Transaction.js — Payout Transaction Schema
 * Tracks every payout attempt with full audit trail
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        // Core payout details
        beneficiary: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Beneficiary',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [1, 'Amount must be at least ₹1'],
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR'],
        },
        purpose: {
            type: String,
            enum: ['salary', 'vendor', 'refund', 'business', 'other'],
            default: 'business',
        },
        narration: {
            type: String,
            trim: true,
            maxlength: [100, 'Narration cannot exceed 100 characters'],
        },
        mode: {
            type: String,
            enum: ['NEFT', 'RTGS', 'IMPS', 'UPI'],
            default: 'IMPS',
        },

        // Status Tracking
        status: {
            type: String,
            enum: ['pending', 'queued', 'processing', 'processed', 'reversed', 'cancelled', 'failed'],
            default: 'pending',
        },

        // Idempotency — ensures no double payments
        idempotencyKey: {
            type: String,
            unique: true,
            required: true,
        },

        // RazorpayX Payout Reference
        razorpayPayoutId: { type: String, default: null },
        referenceId: { type: String, default: null }, // Our internal reference

        // UTR — Unique Transaction Reference (from bank, available after processing)
        utr: { type: String, default: null },

        // Webhook data (raw response from RazorpayX)
        webhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },

        // Error tracking
        failureReason: { type: String, default: null },

        // Who initiated the payout
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },

        // Timestamps for state changes
        queuedAt: { type: Date, default: null },
        processedAt: { type: Date, default: null },
        failedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

// Indexes — idempotencyKey is already indexed via unique:true in the field definition
transactionSchema.index({ status: 1 });
transactionSchema.index({ beneficiary: 1 });
transactionSchema.index({ razorpayPayoutId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
