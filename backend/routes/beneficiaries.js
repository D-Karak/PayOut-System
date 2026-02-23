/**
 * routes/beneficiaries.js
 */

const express = require('express');
const router = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');
const ipWhitelist = require('../middleware/ipWhitelist');
const {
    addBeneficiary,
    getAllBeneficiaries,
    getBeneficiary,
    deleteBeneficiary
} = require('../controllers/beneficiaryController');

// All beneficiary routes require admin auth + IP whitelist
router.use(verifyAdmin, ipWhitelist);

router.route('/')
    .get(getAllBeneficiaries)
    .post(addBeneficiary);

router.route('/:id')
    .get(getBeneficiary)
    .delete(deleteBeneficiary);

module.exports = router;
