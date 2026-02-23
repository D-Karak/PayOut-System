/**
 * utils/seed.js — Admin User Seeder
 * Run once: node utils/seed.js
 */

// Override DNS in dev — local ISP may block MongoDB SRV lookups
if (process.env.NODE_ENV !== 'production') {
    const dns = require('dns');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}
require('dotenv').config(); // .env is in the same backend/ folder
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Remove existing admin
        await Admin.deleteMany({});
        console.log('🗑️  Cleared existing admins');

        // Create admin from env vars
        const admin = await Admin.create({
            name: 'System Admin',
            email: process.env.ADMIN_EMAIL || 'admin@payoutsystem.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123456',
            role: 'admin'
        });

        console.log(`\n✅ Admin created successfully!`);
        console.log(`   Email:    ${admin.email}`);
        console.log('\n⚠️  IMPORTANT: Ensure a strong password is set in your .env (ADMIN_PASSWORD).\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seed();
