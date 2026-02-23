/**
 * controllers/beneficiaryController.js — Beneficiary CRUD
 * Handles creating a RazorpayX Contact + Fund Account (Composite API)
 */

const Beneficiary = require('../models/Beneficiary');
const razorpay = require('../config/razorpay');
const logger = require('../utils/logger');

// ─── Helper: Create Contact on RazorpayX ─────────────────────────────
const createRazorpayContact = async (beneficiary) => {
    const contact = await razorpay.contacts.create({
        name: beneficiary.name,
        email: beneficiary.email,
        contact: beneficiary.phone || '',
        type: 'vendor',
        reference_id: beneficiary._id.toString(),
        notes: {
            system: 'PayoutSystem',
            beneficiaryId: beneficiary._id.toString()
        }
    });
    return contact;
};

// ─── Helper: Create Fund Account on RazorpayX ────────────────────────
const createRazorpayFundAccount = async (contactId, beneficiary) => {
    const fundAccount = await razorpay.fundAccount.create({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
            name: beneficiary.name,
            ifsc: beneficiary.bankAccount.ifscCode,
            account_number: beneficiary.bankAccount.accountNumber,
        }
    });
    return fundAccount;
};

// ─── POST /api/beneficiaries ──────────────────────────────────────────
exports.addBeneficiary = async (req, res) => {
    try {
        const { name, email, phone, bankAccount } = req.body;

        // Validate required fields
        if (!name || !email || !bankAccount?.accountNumber || !bankAccount?.ifscCode) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, account number, and IFSC code are required.'
            });
        }

        // Check for duplicate email
        const existing = await Beneficiary.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'A beneficiary with this email already exists.'
            });
        }

        // 1. Save to MongoDB first (to get the _id)
        const beneficiary = await Beneficiary.create({
            name,
            email,
            phone,
            bankAccount,
            createdBy: req.admin._id
        });

        // 2. Create Contact on RazorpayX (Composite API Step 1)
        let razorpayContact = null;
        let razorpayFundAcct = null;

        try {
            razorpayContact = await createRazorpayContact(beneficiary);
            razorpayFundAcct = await createRazorpayFundAccount(razorpayContact.id, beneficiary);

            // Update MongoDB with RazorpayX references
            beneficiary.razorpayContactId = razorpayContact.id;
            beneficiary.razorpayFundAccountId = razorpayFundAcct.id;
            await beneficiary.save();

            logger.info(`RazorpayX: Contact ${razorpayContact.id} + FundAccount ${razorpayFundAcct.id} created for beneficiary ${beneficiary._id}`);

        } catch (rzpError) {
            logger.warn(`RazorpayX creation failed for beneficiary ${beneficiary._id}: ${rzpError.message}. Beneficiary saved locally.`);
            // Don't block the response — admin can retry later
        }

        // Mask account number — never send full account number over the wire
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
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Cap at 100
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
