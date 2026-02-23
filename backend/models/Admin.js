/**
 * models/Admin.js — Admin User Schema
 * Single admin user for the payout system dashboard
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Admin name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Never return password in queries
        },
        role: {
            type: String,
            default: 'admin',
            enum: ['admin'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Pre-save Hook: Hash password ─────────────────────────────────────
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ─── Instance Method: Compare password ───────────────────────────────
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Safe object (no password) ───────────────────────
adminSchema.methods.toSafeObject = function () {
    const { password, __v, ...safe } = this.toObject();
    return safe;
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
