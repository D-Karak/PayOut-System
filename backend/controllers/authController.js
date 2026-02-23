/**
 * controllers/authController.js — Admin Authentication
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

// ─── Helper: Sign JWT ─────────────────────────────────────────────────
const signToken = (id) => {
    return jwt.sign(
        { id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// ─── POST /api/auth/login ─────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // 2. Find admin (explicitly select password for comparison)
        const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
        if (!admin) {
            logger.warn(`Failed login attempt for email: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // 3. Compare password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Failed login attempt for admin: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // 4. Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your admin account has been deactivated.'
            });
        }

        // 5. Update last login
        admin.lastLogin = new Date();
        await admin.save({ validateBeforeSave: false });

        // 6. Issue JWT
        const token = signToken(admin._id);

        logger.info(`Admin logged in: ${admin.email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                lastLogin: admin.lastLogin
            }
        });

    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            admin: req.admin
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────
exports.logout = (req, res) => {
    // JWT is stateless — invalidation is handled client-side (delete the token)
    // For production, use a token blacklist (Redis) for immediate revocation
    logger.info(`Admin logged out: ${req.admin?.email}`);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
