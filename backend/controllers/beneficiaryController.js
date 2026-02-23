/**
 * controllers/beneficiaryController.js — Beneficiary CRUD
 */

const Beneficiary = require('../models/Beneficiary');
const { createContact, createFundAccount } = require('../utils/razorpayX');
const logger = require('../utils/logger');

// ─── POST /api/beneficiaries ──────────────────────────────────────────
exports.addBeneficiary = async (req, res) => {
    try {
        const { name, email, phone, bankAccount } = req.body;

        if (!name || !email || !bankAccount?.accountNumber || !bankAccount?.ifscCode) {
            return res.status(400).json({ success: false, message: 'Name, email, account number, and IFSC code are required.' });
        }

        const existing = await Beneficiary.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A beneficiary with this email already exists.' });
        }

        const beneficiary = await Beneficiary.create({ name, email, phone, bankAccount, createdBy: req.admin._id });

        let razorpayContact = null;
        let razorpayFundAcct = null;

        try {
            razorpayContact = await createContact(beneficiary);
            razorpayFundAcct = await createFundAccount(razorpayContact.id, beneficiary);

            beneficiary.razorpayContactId = razorpayContact.id;
            beneficiary.razorpayFundAccountId = razorpayFundAcct.id;
            await beneficiary.save();

            logger.info(`RazorpayX: Contact ${razorpayContact.id} + FundAccount ${razorpayFundAcct.id} created for beneficiary ${beneficiary._id}`);
        } catch (rzpError) {
            logger.warn(`RazorpayX creation failed for beneficiary ${beneficiary._id}: ${rzpError.message}. Beneficiary saved locally.`);
        }

        const safeBeneficiary = beneficiary.toObject();
        if (safeBeneficiary.bankAccount?.accountNumber) {
            const acc = safeBeneficiary.bankAccount.accountNumber;
            safeBeneficiary.bankAccount.accountNumber = '•'.repeat(acc.length - 4) + acc.slice(-4);
        }

        res.status(201).json({
            success: true,
            message: razorpayContact
                ? 'Beneficiary created and registered with RazorpayX.'
                : 'Beneficiary created locally. RazorpayX registration pending.',
            beneficiary: safeBeneficiary
        });

    } catch (error) {
        logger.error(`addBeneficiary error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to add beneficiary.' });
    }
};

// ─── GET /api/beneficiaries ───────────────────────────────────────────
exports.getAllBeneficiaries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim();

        const query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [beneficiaries, total] = await Promise.all([
            Beneficiary.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Beneficiary.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: beneficiaries,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        logger.error(`getAllBeneficiaries error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch beneficiaries.' });
    }
};

// ─── GET /api/beneficiaries/:id ───────────────────────────────────────
exports.getBeneficiary = async (req, res) => {
    try {
        const beneficiary = await Beneficiary.findById(req.params.id);
        if (!beneficiary || !beneficiary.isActive) {
            return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
        }
        res.status(200).json({ success: true, data: beneficiary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch beneficiary.' });
    }
};

// ─── DELETE /api/beneficiaries/:id (soft delete) ─────────────────────
exports.deleteBeneficiary = async (req, res) => {
    try {
        const beneficiary = await Beneficiary.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary not found.' });
        }
        res.status(200).json({ success: true, message: 'Beneficiary removed successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove beneficiary.' });
    }
};