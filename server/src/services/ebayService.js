const axios = require('axios');
require('dotenv').config();

// eBay API configuration
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || 'Your-Client-ID';
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || 'Your-Client-Secret';

// Use mock data as fallback - always true for now due to rate limits
const USE_MOCK_DATA = true; // Force mock data until rate limits reset

// eBay API endpoints
const AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

// Cache durations
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const apiCache = {};

// Token storage
let accessToken = null;
let tokenExpiry = null;

/**
 * Get OAuth access token for eBay API
 */
async function getEbayAccessToken() {
  if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
    console.log('Reusing cached eBay access token...');
    return accessToken;
  }
  
  try {
    console.log('Requesting new eBay access token...');
    const response = await axios.post(
      AUTH_URL,
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000); // Subtract 5 mins for safety
    return accessToken;
  } catch (error) {
    console.error('Error fetching eBay access token:', error.response?.data || error.message);
    throw new Error('Failed to fetch eBay access token');
  }
}

/**
 * Search for completed manga set listings
 * This function now ALWAYS returns mock data due to API rate limits
 */
async function searchCompletedMangaSets(series, volumes) {
  try {
    // Create cache key from search params
    const cacheKey = `${series}_${volumes}`;
    
    // Check if we have cached results that aren't expired
    if (apiCache[cacheKey] && apiCache[cacheKey].timestamp > Date.now() - CACHE_TTL) {
      console.log('Using cached search results');
      return apiCache[cacheKey].data;
    }
    
    console.log(`Searching for: ${series} manga ${volumes}`);
    console.log('Using mock data due to eBay API rate limits');
    
    // Parse volume range
    let volumeStart, volumeEnd;
    if (volumes && volumes.includes('-')) {
      [volumeStart, volumeEnd] = volumes.split('-').map(v => parseInt(v, 10));
    } else if (volumes) {
      volumeStart = parseInt(volumes, 10);
      volumeEnd = volumeStart;
    } else {
      volumeStart = 1;
      volumeEnd = 10;
    }
    
    // Generate mock results
    const mockResult = getMockSearchResults(series, volumes);
    
    // Cache the mock result
    apiCache[cacheKey] = {
      timestamp: Date.now(),
      data: mockResult
    };
    
    return mockResult;
  } catch (error) {
    console.error('Search error:', error);
    return getMockSearchResults(series, volumes);
  }
}

/**
 * Calculate price metrics from sold listings data
 */
function calculateMangaPrices(items, totalVolumes) {
  if (!items || items.length === 0) {
    return {
      averageSetPrice: 0,
      pricePerVolume: 0,
      priceTrend: 0,
      numberOfListings: 0,
      recentSales: []
    };
  }
  
  // Extract prices
  const prices = items.map(item => {
    return parseFloat(item.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.__value__ || 0);
  }).filter(price => !isNaN(price) && price > 0);
  
  if (prices.length === 0) {
    return {
      averageSetPrice: 0,
      pricePerVolume: 0,
      priceTrend: 0,
      numberOfListings: 0,
      recentSales: []
    };
  }
  
  // Calculate price statistics
  const sum = prices.reduce((total, price) => total + price, 0);
  const averageSetPrice = sum / prices.length;
  const pricePerVolume = averageSetPrice / totalVolumes;
  
  // Get recent sales data for display
  const recentSales = items.slice(0, 5).map(item => ({
    title: item.title?.[0] || 'Unknown title',
    price: parseFloat(item.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.__value__ || 0),
    endTime: item.listingInfo?.[0]?.endTime?.[0] || new Date().toISOString(),
    url: item.viewItemURL?.[0] || ''
  }));

  // Calculate price trend (mock for now - would need historical data)
  const priceTrend = Math.random() * 20 - 10; // -10% to +10% for demo
  
  return {
    averageSetPrice,
    pricePerVolume,
    priceTrend,
    numberOfListings: items.length,
    recentSales
  };
}

/**
 * Fetch manga prices
 */
async function fetchEbayPrices(series, volumeStart, volumeEnd, condition) {
  try {
    // Handle different parameter formats
    let volumes;
    let totalVols;
    
    // Check if first parameter is a volume range string
    if (typeof volumeStart === 'string' && volumeStart.includes('-')) {
      volumes = volumeStart;
      const [start, end] = volumes.split('-').map(v => parseInt(v));
      volumeStart = start;
      volumeEnd = end;
      totalVols = volumeEnd - volumeStart + 1;
    } else if (typeof volumeStart === 'number' && typeof volumeEnd === 'number') {
      volumes = `${volumeStart}-${volumeEnd}`;
      totalVols = volumeEnd - volumeStart + 1;
    } else {
      // Handle single volume
      volumes = volumeStart.toString();
      volumeEnd = volumeStart;
      totalVols = 1;
    }
    
    // Call search function which will return mock data
    const searchResults = await searchCompletedMangaSets(series, volumes);
    
    if (!searchResults.success) {
      console.log('No successful search results, using mock price data');
      return getMockPriceData(series, totalVols);
    }
    
    // Calculate price metrics
    const priceData = calculateMangaPrices(searchResults.data, totalVols);
    
    if (!priceData || priceData.averageSetPrice === 0) {
      console.log('No valid price data calculated, using mock price data');
      return getMockPriceData(series, totalVols);
    }
    
    return {
      averagePrice: priceData.averageSetPrice,
      priceTrend: priceData.priceTrend,
      numberOfListings: priceData.numberOfListings,
      recentSales: priceData.recentSales,
      source: 'mock' // Add source to indicate this is mock data
    };
  } catch (error) {
    console.error('Error in fetchEbayPrices:', error);
    return getMockPriceData(series, volumeEnd - volumeStart + 1);
  }
}

/**
 * Create mock search results for testing.
 */
function getMockSearchResults(series, volumes) {
  let volumeStart, volumeEnd;
  if (volumes && volumes.includes('-')) {
    [volumeStart, volumeEnd] = volumes.split('-').map(v => parseInt(v, 10));
  } else if (volumes) {
    volumeStart = parseInt(volumes, 10);
    volumeEnd = volumeStart;
  } else {
    volumeStart = 1;
    volumeEnd = 10;
  }
  
  const totalVolumes = volumeEnd - volumeStart + 1;
  const isComplete = totalVolumes > 5;
  
  // Generate 3-5 realistic listings
  const count = Math.floor(Math.random() * 3) + 3;
  const items = [];
  
  // Set base price to be more realistic for manga
  const basePricePerVolume = 9 + Math.random() * 6; // $9-$15 per volume
  
  for (let i = 0; i < count; i++) {
    // Generate a realistic price with volume discount for larger sets
    const discount = totalVolumes > 20 ? 0.25 : // 25% discount for large sets
                    totalVolumes > 10 ? 0.15 : // 15% discount for medium sets
                    totalVolumes > 5 ? 0.1 : 0; // 10% discount for small sets
    
    const pricePerVolume = basePricePerVolume * (1 - discount);
    const priceVariation = Math.random() * 0.2 - 0.1; // +/- 10% variation
    const totalPrice = (pricePerVolume * (1 + priceVariation)) * totalVolumes;
    
    const now = new Date();
    const endDate = new Date(now.setDate(now.getDate() - (i * 3 + Math.floor(Math.random() * 10)))); // More randomized recent dates
    
    items.push({
      itemId: [String(10000000 + Math.floor(Math.random() * 1000000))],
      title: [`${series} Manga ${isComplete ? 'Complete' : ''} Set Volumes ${volumeStart}-${volumeEnd} ${getRandomCondition()}`],
      viewItemURL: [`https://www.ebay.com/itm/${10000000 + Math.floor(Math.random() * 1000000)}`],
      sellingStatus: [{
        convertedCurrentPrice: [{
          __value__: String(totalPrice.toFixed(2)),
          _currencyId: "USD"
        }],
        sellingState: ["EndedWithSales"]
      }],
      listingInfo: [{
        endTime: [endDate.toISOString()],
        listingType: [Math.random() > 0.3 ? "FixedPrice" : "Auction"]
      }]
    });
  }
  
  return { 
    success: true, 
    message: `Found ${count} mock listings for testing`, 
    data: items,
    source: 'mock'
  };
}

// Helper function to get random condition for mock listings
function getRandomCondition() {
  const conditions = [
    "Like New", "Very Good Condition", "Good Condition", 
    "Acceptable", "Used", "Complete Set", "First Print"
  ];
  return conditions[Math.floor(Math.random() * conditions.length)];
}

/**
 * Generate mock price data for testing
 */
function getMockPriceData(series, totalVolumes) {
  // Set base price to be more realistic for manga
  const basePricePerVolume = 9 + Math.random() * 6; // $9-$15 per volume
  
  // Apply volume discount for larger sets
  const discount = totalVolumes > 20 ? 0.25 : // 25% discount for large sets
                  totalVolumes > 10 ? 0.15 : // 15% discount for medium sets
                  totalVolumes > 5 ? 0.1 : 0; // 10% discount for small sets
  
  const discountedPricePerVolume = basePricePerVolume * (1 - discount);
  const totalPrice = discountedPricePerVolume * totalVolumes;
  
  // Add some variation
  const priceVariation = Math.random() * 0.2 - 0.1; // +/- 10%
  const adjustedPrice = totalPrice * (1 + priceVariation);
  
  // Generate 2-4 mock recent sales with realistic data
  const salesCount = Math.floor(Math.random() * 3) + 2;
  const recentSales = [];
  
  const conditions = ["Like New", "Very Good", "Good", "Acceptable"];
  
  for (let i = 0; i < salesCount; i++) {
    const individualVariation = Math.random() * 0.2 - 0.1; // +/- 10% from average price
    const price = adjustedPrice * (1 + individualVariation);
    const now = new Date();
    const saleDate = new Date(now.setDate(now.getDate() - (i * 5 + Math.floor(Math.random() * 10))));
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    recentSales.push({
      title: `${series} Manga Set (${totalVolumes} volumes) - ${condition} Condition`,
      price: parseFloat(price.toFixed(2)),
      endTime: saleDate.toISOString(),
      url: `#mock-listing-${i}`,
      condition: condition
    });
  }
  
  return {
    averagePrice: parseFloat(adjustedPrice.toFixed(2)),
    pricePerVolume: parseFloat((adjustedPrice / totalVolumes).toFixed(2)),
    priceTrend: parseFloat((Math.random() * 10 - 5).toFixed(1)), // -5% to +5%
    numberOfListings: salesCount,
    recentSales: recentSales,
    source: 'mock' // Add source to indicate this is mock data
  };
}

// Export the functions
module.exports = {
  searchCompletedMangaSets,
  getEbayAccessToken,
  fetchEbayPrices,
  calculateMangaPrices
};