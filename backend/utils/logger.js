/**
 * utils/logger.js — Winston Logger
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Shared format
const sharedFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

// Console format (pretty print)
const consolePretty = format.combine(
    format.colorize(),
    format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

// Build transport list
const loggerTransports = [
    // Console — always on (Render captures stdout natively)
    new transports.Console({ format: consolePretty })
];

// Exception handlers — separate instances required by Winston
const exceptionHandlers = [
    new transports.Console({ format: consolePretty })
];

// File transports — ONLY in development
// Render's filesystem is ephemeral; logs/ dir won't exist in production
if (!isProduction) {
    loggerTransports.push(
        new transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        }),
        new transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        })
    );

    exceptionHandlers.push(
        new transports.File({
            filename: path.join(__dirname, '../logs/exceptions.log')
        })
    );
}

const logger = createLogger({
    level: isProduction ? 'warn' : 'info',
    format: sharedFormat,
    transports: loggerTransports,
    exceptionHandlers,
    exitOnError: false // Don't crash the process on handled exceptions
});

module.exports = logger;
