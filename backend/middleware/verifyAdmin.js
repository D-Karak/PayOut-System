/**
 * middleware/verifyAdmin.js — JWT Authentication Middleware
 * All protected routes must pass through this guard
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

const verifyAdmin = async (req, res, next) => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No authentication token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify the JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Authentication failed.'
            });
        }

        // 3. Verify the admin still exists and is active
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin account not found.'
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Admin account has been deactivated.'
            });
        }

        // 4. Attach admin to request object
        req.admin = admin;
        logger.info(`Admin authenticated: ${admin.email} → ${req.method} ${req.originalUrl}`);
        next();

    } catch (error) {
        logger.error(`Auth middleware error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed due to a server error.'
        });
    }
};

module.exports = verifyAdmin;
