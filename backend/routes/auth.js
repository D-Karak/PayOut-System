/**
 * routes/auth.js
 */

const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const verifyAdmin = require('../middleware/verifyAdmin');

// POST /api/auth/login
router.post('/login', login);

// GET  /api/auth/me  (protected)
router.get('/me', verifyAdmin, getMe);

// POST /api/auth/logout (protected)
router.post('/logout', verifyAdmin, logout);

module.exports = router;
