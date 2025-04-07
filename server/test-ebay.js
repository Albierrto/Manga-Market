const axios = require('axios');
require('dotenv').config();

// Get credentials from environment
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

// Simple test function
async function testEbayAuth() {
  try {
    console.log('Testing eBay API credentials...');
    console.log('Client ID:', EBAY_CLIENT_ID ? 'Present (starts with ' + EBAY_CLIENT_ID.substring(0, 10) + '...)' : 'Missing');
    console.log('Client Secret:', EBAY_CLIENT_SECRET ? 'Present (not shown for security)' : 'Missing');
    
    // Attempt to get a token
    const response = await axios.post(
      'https://api.ebay.com/identity/v1/oauth2/token',
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      console.log('✅ Authentication successful!');
      console.log('Access token received:', response.data.access_token.substring(0, 20) + '...');
      console.log('Token expires in:', response.data.expires_in, 'seconds');
      
      // Now try a simple Finding API request
      console.log('\nTesting Finding API...');
      await testFindingApi(response.data.access_token);
    }
  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error(error.response?.data || error.message);
  }
}

async function testFindingApi(token) {
  try {
    // This is a very basic test just to see if the API responds
    const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': EBAY_CLIENT_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': 'test',
        'paginationInput.entriesPerPage': '1'
      },
      headers: {
        'X-EBAY-SOA-SERVICE-NAME': 'FindingService',
        'X-EBAY-SOA-OPERATION-NAME': 'findItemsByKeywords',
        'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
        'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
        'X-EBAY-SOA-SECURITY-APPNAME': EBAY_CLIENT_ID,
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON'
      }
    });
    
    console.log('✅ Finding API test successful!');
    console.log('Response contains data:', !!response.data);
  } catch (error) {
    console.error('❌ Finding API test failed:');
    console.error(error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', JSON.stringify(error.response?.headers, null, 2));
  }
}

// Run the test
testEbayAuth();