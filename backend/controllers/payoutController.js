/**
 * controllers/payoutController.js — Core Payout Logic
 * Executes payouts via RazorpayX with idempotency guarantees
 */

const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const Beneficiary = require('../models/Beneficiary');
const { createPayout } = require('../utils/razorpayX');
const logger = require('../utils/logger');

// ─── POST /api/payouts ────────────────────────────────────────────────
exports.initiatePayout = async (req, res) => {
    try {
        const { beneficiaryId, amount, purpose, narration, mode } = req.body;
        const idempotencyKey = req.idempotencyKey; // Set by idempotency middleware

        // 1. Validate essential input
        if (!beneficiaryId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'beneficiaryId and amount are required.'
            });
        }

        if (amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be at least ₹1.'
            });
        }

        // 2. Fetch & validate beneficiary
        const beneficiary = await Beneficiary.findById(beneficiaryId);
        if (!beneficiary || !beneficiary.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found or inactive.'
            });
        }

        if (!beneficiary.razorpayFundAccountId) {
            return res.status(422).json({
                success: false,
                message: 'Beneficiary is not yet registered with RazorpayX. Please complete their setup first.'
            });
        }

        // 3. Generate internal reference ID
        const referenceId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // 4. Create Transaction record in MongoDB (status: pending)
        const transaction = await Transaction.create({
            beneficiary: beneficiaryId,
            amount,
            purpose: purpose || 'business',
            narration: narration || `Payout to ${beneficiary.name}`,
            mode: mode || 'IMPS',
            status: 'pending',
            idempotencyKey,
            referenceId,
            initiatedBy: req.admin._id
        });

        // 5. Execute the Payout via RazorpayX API
        try {
            const payoutPayload = {
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                fund_account_id: beneficiary.razorpayFundAccountId,
                amount: amount * 100,   // RazorpayX uses paise (₹1 = 100 paise)
                currency: 'INR',
                mode: mode || 'IMPS',
                purpose: purpose || 'payout',
                reference_id: referenceId,
                narration: narration || `Payout to ${beneficiary.name}`,
                queue_if_low_balance: true,
            };

            const rzpPayout = await createPayout(payoutPayload, idempotencyKey);

            // 6. Update transaction with RazorpayX payout ID and status
            transaction.razorpayPayoutId = rzpPayout.id;
            transaction.status = rzpPayout.status || 'queued';
            transaction.queuedAt = new Date();
            await transaction.save();

            logger.info(`Payout initiated: ${rzpPayout.id} | Amount: ₹${amount} | Beneficiary: ${beneficiary.name}`);

            return res.status(201).json({
                success: true,
                message: 'Payout initiated successfully.',
                transaction: await transaction.populate('beneficiary', 'name email')
            });

        } catch (rzpError) {
            // RazorpayX rejected the payout
            transaction.status = 'failed';
            transaction.failureReason = rzpError.description || rzpError.message;
            transaction.failedAt = new Date();
            await transaction.save();

            logger.error(`RazorpayX payout failed [${referenceId}]: ${rzpError.message}`);

            return res.status(422).json({
                success: false,
                message: `Payout failed: ${rzpError.description || rzpError.message}`,
                transaction
            });
        }

    } catch (error) {
        logger.error(`initiatePayout error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to initiate payout.' });
    }
};

// ─── GET /api/payouts ─────────────────────────────────────────────────
exports.getPayoutHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 15, 100); // Cap at 100
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search?.trim();

        const query = {};
        if (status && status !== 'all') query.status = status;

        // Build aggregation for search across beneficiary name
        let transactions;
        let total;

        if (search) {
            // Join with beneficiaries to search by name
            const beneficiaryIds = await Beneficiary.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).distinct('_id');

            query.beneficiary = { $in: beneficiaryIds };
        }

        [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('beneficiary', 'name email bankAccount.bankName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        // Stats summary
        const stats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: transactions,
            stats,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        logger.error(`getPayoutHistory error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch payout history.' });
    }
};

// ─── GET /api/payouts/:id ─────────────────────────────────────────────
exports.getPayoutById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('beneficiary')
            .populate('initiatedBy', 'name email');

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }
        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch transaction.' });
    }
};

// ─── GET /api/payouts/stats/dashboard ────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalTransactions,
            totalBeneficiaries,
            statusCounts,
            recentTransactions
        ] = await Promise.all([
            Transaction.countDocuments(),
            Beneficiary.countDocuments({ isActive: true }),
            Transaction.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        amount: { $sum: '$amount' }
                    }
                }
            ]),
            Transaction.find()
                .populate('beneficiary', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const stats = {
            total: totalTransactions,
            beneficiaries: totalBeneficiaries,
            byStatus: statusCounts.reduce((acc, cur) => {
                acc[cur._id] = { count: cur.count, amount: cur.amount };
                return acc;
            }, {}),
            recentTransactions
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        logger.error(`getDashboardStats error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
    }
};
