/**
 * utils/razorpayX.js — Direct RazorpayX API helpers
 * The razorpay npm SDK does not include contacts or payouts resources.
 * These helpers call the RazorpayX REST API directly via Node.js https.
 */

const https = require('https');

const getAuth = () =>
    Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

const apiCall = (path, body) => {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const options = {
            hostname: 'api.razorpay.com',
            path,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${getAuth()}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        const err = new Error(
                            parsed.error?.description ||
                            parsed.error?.code ||
                            `RazorpayX API error: HTTP ${res.statusCode}`
                        );
                        err.statusCode = res.statusCode;
                        err.description = parsed.error?.description;
                        reject(err);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse RazorpayX response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
};

// Create a Contact on RazorpayX
const createContact = (beneficiary) =>
    apiCall('/v1/contacts', {
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

// Create a Fund Account linked to a Contact
const createFundAccount = (contactId, beneficiary) =>
    apiCall('/v1/fund_accounts', {
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
            name: beneficiary.name,
            ifsc: beneficiary.bankAccount.ifscCode,
            account_number: beneficiary.bankAccount.accountNumber
        }
    });

// Initiate a Payout
const createPayout = (payload, idempotencyKey) => {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(payload);
        const options = {
            hostname: 'api.razorpay.com',
            path: '/v1/payouts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${getAuth()}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'X-Payout-Idempotency': idempotencyKey
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        const err = new Error(
                            parsed.error?.description ||
                            `RazorpayX payout error: HTTP ${res.statusCode}`
                        );
                        err.statusCode = res.statusCode;
                        err.description = parsed.error?.description;
                        reject(err);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse RazorpayX response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
};

module.exports = { createContact, createFundAccount, createPayout };
