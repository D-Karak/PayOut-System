/**
 * models/Beneficiary.js — Beneficiary Schema
 * Stores contact and bank account details for payout recipients
 */

const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Beneficiary name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        phone: {
            type: String,
            match: [/^[0-9]{10}$/, 'Phone must be a 10-digit number'],
        },

        // Bank Account Information
        bankAccount: {
            accountNumber: {
                type: String,
                required: [true, 'Account number is required'],
            },
            ifscCode: {
                type: String,
                required: [true, 'IFSC code is required'],
                uppercase: true,
                match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'],
            },
            accountType: {
                type: String,
                enum: ['savings', 'current'],
                default: 'savings',
            },
            bankName: {
                type: String,
                trim: true,
            },
        },

        // RazorpayX References (populated after creating contact/fund_account)
        razorpayContactId: { type: String, default: null },
        razorpayFundAccountId: { type: String, default: null },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster lookups
beneficiarySchema.index({ email: 1 });
beneficiarySchema.index({ razorpayContactId: 1 });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
module.exports = Beneficiary;
