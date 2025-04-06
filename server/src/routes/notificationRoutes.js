const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Simple test route to verify the router is working
router.get('/test', (req, res) => {
  res.status(200).send('Test endpoint working!');
});

// Route to handle incoming eBay notifications (POST)
router.post('/ebay-notifications', (req, res) => {
  console.log('eBay notification received:');
  console.log(JSON.stringify(req.body, null, 2));
  
  // Always respond with a 200 status code to acknowledge receipt
  res.status(200).send('Notification received');
});

// Updated route to handle eBay verification challenge (GET)
router.get('/ebay-notifications', (req, res) => {
  console.log('eBay verification request received');
  console.log('Query parameters:', req.query);

  const challenge = req.query.challenge_code;
  if (!challenge) {
    return res.status(400).send('Missing challenge_code parameter');
  }

  // Load token and endpoint from environment variables
  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;
  const endpoint = process.env.EBAY_ENDPOINT;

  if (!verificationToken || !endpoint) {
    console.error('Missing EBAY_VERIFICATION_TOKEN or EBAY_ENDPOINT in .env');
    return res.status(500).send('Server configuration error');
  }

  // Concatenate in this exact order: challengeCode + verificationToken + endpoint
  const combinedString = challenge + verificationToken + endpoint;

  // Compute SHA-256 hash and output hexadecimal digest
  const hash = crypto.createHash('sha256');
  hash.update(combinedString);
  const challengeResponse = hash.digest('hex');

  console.log('Computed challengeResponse:', challengeResponse);
  res.status(200).json({ challengeResponse });
});

module.exports = router;
