/**
 * middleware/ipWhitelist.js — IP Whitelisting Middleware
 *
 * Conceptual implementation: In production, combine this with a
 * firewall/proxy rule (e.g., AWS Security Groups, Nginx allow/deny).
 * This layer provides an application-level safety net.
 */

const logger = require('../utils/logger');

const ipWhitelist = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // Skip IP whitelisting in development
        return next();
    }

    const allowedIPs = (process.env.ALLOWED_IPS || '')
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean);

    if (allowedIPs.length === 0) {
        // No whitelist configured — allow all (not recommended for production)
        logger.warn('⚠️  IP Whitelist is empty. Allowing all IPs (configure ALLOWED_IPS).');
        return next();
    }

    // Get real client IP
    // ⚠️  Only trust X-Forwarded-For if TRUST_PROXY is explicitly set to true
    // Otherwise, use the actual socket remote address to prevent IP spoofing
    const trustProxy = process.env.TRUST_PROXY === 'true';
    const clientIP = trustProxy
        ? req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip
        : req.socket?.remoteAddress || req.ip;

    // Normalize IPv6 loopback
    const normalizedIP = clientIP === '::1' ? '127.0.0.1' : clientIP;

    if (allowedIPs.includes(normalizedIP)) {
        logger.info(`IP Whitelist ✅ — Allowed IP: ${normalizedIP}`);
        return next();
    }

    logger.warn(`IP Whitelist 🚫 — Blocked IP: ${normalizedIP} attempting ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
        success: false,
        message: 'Access forbidden. Your IP is not whitelisted for this operation.'
    });
};

module.exports = ipWhitelist;
