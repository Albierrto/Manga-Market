const axios = require('axios');
const path = require('path');

// Load environment variables with explicit path
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

// Get credentials from environment
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

// Simple test function
async function testEbayAuth() {
  try {
    console.log('==========================================');
    console.log('DEBUGGING ENVIRONMENT VARIABLES:');
    console.log('==========================================');
    console.log('Current directory:', __dirname);
    console.log('EBAY_CLIENT_ID:', EBAY_CLIENT_ID || 'Not found');
    console.log('EBAY_CLIENT_ID length:', EBAY_CLIENT_ID ? EBAY_CLIENT_ID.length : 0);
    console.log('EBAY_CLIENT_SECRET:', EBAY_CLIENT_SECRET ? '*****' : 'Not found');
    console.log('EBAY_CLIENT_SECRET length:', EBAY_CLIENT_SECRET ? EBAY_CLIENT_SECRET.length : 0);
    console.log('==========================================');
    
    // Check if credentials exist
    if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
      console.error('❌ ERROR: eBay credentials are missing from environment variables.');
      console.error('Please check that your .env file exists and has the correct values.');
      console.error('Make sure you are running this script from the server directory.');
      return;
    }
    
    console.log('Testing eBay API credentials...');
    
    // Create the authorization string
    const authString = `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`;
    console.log('Authorization header (first 20 chars):', authString.substring(0, 20) + '...');
    
    // Attempt to get a token
    console.log('Making authentication request to eBay...');
    const response = await axios.post(
      'https://api.ebay.com/identity/v1/oauth2/token',
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authString
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
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Network issue?');
    } else {
      console.error('Error message:', error.message);
    }
    
    console.error('\nPossible issues:');
    console.error('- Credentials are incorrect or truncated');
    console.error('- Application permissions are not set correctly in eBay Developer Portal');
    console.error('- eBay Developer account might be inactive or require verification');
  }
}

async function testFindingApi(token) {
  try {
    // Use a more focused search that might be less rate-limited
    const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findCompletedItems', // Use completed items instead of general search
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': EBAY_CLIENT_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': true,
        'keywords': 'naruto manga volume 1',  // More specific query
        'categoryId': '261186',  // Comics & Graphic Novels category
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
        'paginationInput.entriesPerPage': '1'  // Request just one item to reduce data
      },
      headers: {
        'X-EBAY-SOA-SERVICE-NAME': 'FindingService',
        'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
        'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
        'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
        'X-EBAY-SOA-SECURITY-APPNAME': EBAY_CLIENT_ID,
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON'
      }
    });
    
    console.log('✅ Finding API test successful!');
    console.log('Response contains data:', !!response.data);
    
    // Show a preview of the data
    if (response.data) {
      console.log('Response preview:', JSON.stringify(response.data).substring(0, 300) + '...');
    }
  } catch (error) {
    console.error('❌ Finding API test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Check for rate limit error
      if (error.response.status === 500 && 
          error.response.data?.errorMessage?.[0]?.error?.[0]?.errorId?.[0] === "10001") {
        console.log("\n🚨 RATE LIMIT DETECTED! This is normal for new applications.");
        console.log("You should:");
        console.log("1. Implement strong caching in your application");
        console.log("2. Wait 24 hours for higher rate limits");
        console.log("3. Consider applying for increased call limits with eBay");
      }
    } else if (error.request) {
      console.error('No response received. Network issue?');
    } else {
      console.error('Error message:', error.message);
    }
  }
}
    


// Run the test
testEbayAuth();