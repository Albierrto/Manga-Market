// src/services/ebayService.js
const axios = require('axios');
require('dotenv').config();

// eBay API configuration
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || 'Your-Client-ID';
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || 'Your-Client-Secret';
const EBAY_SANDBOX = process.env.EBAY_SANDBOX !== 'false'; // true if sandbox

// Endpoints for authentication and Finding API (production vs. sandbox)
const SANDBOX_AUTH_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const PRODUCTION_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const AUTH_URL = EBAY_SANDBOX ? SANDBOX_AUTH_URL : PRODUCTION_AUTH_URL;

const SANDBOX_FINDING_API_URL = 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';
const PRODUCTION_FINDING_API_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';
const FINDING_API_URL = EBAY_SANDBOX ? SANDBOX_FINDING_API_URL : PRODUCTION_FINDING_API_URL;

// In-memory token storage
let accessToken = null;
let tokenExpiry = null;

// Simple in-memory caching for query results
const cache = new Map(); // cache key -> { data, expiry }
const CACHE_TTL = 5 * 60 * 1000; // cache time-to-live: 5 minutes

/**
 * Obtain a new eBay OAuth access token if not cached or expired.
 */
async function getEbayAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    // Using cached token
    return accessToken;
  }
  
  // Create the Basic Auth credentials string
  const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
  const data = 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope';
  
  try {
    const response = await axios.post(AUTH_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      // Set expiry time (subtract 5 minutes as a buffer)
      tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);
      return accessToken;
    } else {
      throw new Error('Failed to obtain access token from eBay');
    }
  } catch (error) {
    console.error('Error getting eBay access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Search for completed manga listings on eBay with caching and exponential backoff.
 * @param {string} series - Manga series name.
 * @param {string} volumes - Volume range string, e.g. "1-5".
 * @param {number} [page=1] - Pagination page number.
 * @returns {Promise<Object>} - An object with keys "success" and "data" (an array of items).
 */
async function searchCompletedMangaSets(series, volumes, page = 1) {
  const cacheKey = `${series}-${volumes}-${page}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    console.log('Returning cached result...');
    return cached.data;
  }
  
  let retries = 0;
  const MAX_RETRIES = 3;
  let backoff = 2000; // start with a 2 second delay

  while (retries < MAX_RETRIES) {
    try {
      const token = await getEbayAccessToken();
      
      const response = await axios.get(FINDING_API_URL, {
        params: {
          'OPERATION-NAME': 'findCompletedItems',
          'SERVICE-VERSION': '1.13.0',
          'SECURITY-APPNAME': EBAY_CLIENT_ID,
          'RESPONSE-DATA-FORMAT': 'JSON',
          'REST-PAYLOAD': true,
          keywords: `${series} manga volumes ${volumes} complete set`,
          categoryId: '261186', // Comics & Graphic Novels
          'itemFilter(0).name': 'SoldItemsOnly',
          'itemFilter(0).value': 'true',
          sortOrder: 'EndTimeSoonest',
          'paginationInput.entriesPerPage': '50',
          'paginationInput.pageNumber': page
        },
        headers: {
          'X-EBAY-SOA-SERVICE-NAME': 'FindingService',
          'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
          'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
          'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
          'X-EBAY-SOA-SECURITY-APPNAME': EBAY_CLIENT_ID,
          'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON'
        },
        timeout: 10000 // 10 second timeout
      });
      
      const items = response.data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
      const data = { success: true, data: items };
      // Cache the result
      cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
      return data;
      
    } catch (error) {
      const errorId = error.response?.data?.errorMessage?.[0]?.error?.[0]?.errorId?.[0];
      if (errorId === '10001') {
        // eBay rate limit error
        retries++;
        console.log(`Rate limit reached. Retry ${retries}/${MAX_RETRIES} after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2;
      } else {
        console.error('eBay API error:', error.response?.data || error.message);
        break; // For non-rate-limit errors, break out of the loop
      }
    }
  }
  
  console.log('Exceeded maximum retries. Returning fallback data.');
  // Return fallback data (you can update this to generate more realistic fallback data)
  return { success: true, data: [] };
}

module.exports = {
  searchCompletedMangaSets,
  getEbayAccessToken
};
