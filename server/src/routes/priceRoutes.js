const express = require('express');
const router = express.Router();
const ebayService = require('../services/ebayService');

// GET /api/prices - Get manga prices from eBay
router.get('/prices', async (req, res) => {
  try {
    const { series, volumes } = req.query;

    if (!series || !volumes) {
      return res.status(400).json({ message: 'Series name and volume range are required' });
    }

    // Call the eBay service function. It returns an object with keys "success" and "data"
    const result = await ebayService.searchCompletedMangaSets(series, volumes);

    // If no valid items returned, send back default data
    if (!Array.isArray(result.data) || result.data.length === 0) {
      return res.status(200).json({
        success: true,
        series,
        volumes,
        data: {
          averageSetPrice: 0,
          pricePerVolume: 0,
          priceTrend: 0,
          numberOfListings: 0,
          recentSales: []
        }
      });
    }

    // Helper function to safely extract the price from an item.
    // It first checks if a "price" property exists (from fallback/mock data).
    // Otherwise, it attempts to get the price from the eBay response structure.
    function extractPrice(item) {
      if (item.price) {
        return parseFloat(item.price);
      } else if (
        item.sellingStatus &&
        Array.isArray(item.sellingStatus) &&
        item.sellingStatus[0] &&
        item.sellingStatus[0].convertedCurrentPrice &&
        Array.isArray(item.sellingStatus[0].convertedCurrentPrice) &&
        item.sellingStatus[0].convertedCurrentPrice[0] &&
        item.sellingStatus[0].convertedCurrentPrice[0].__value__
      ) {
        return parseFloat(item.sellingStatus[0].convertedCurrentPrice[0].__value__);
      }
      return 0;
    }

    // Sum up the prices from each item
    const totalPrice = result.data.reduce((sum, item) => {
      return sum + extractPrice(item);
    }, 0);

    // Calculate average set price
    const averageSetPrice = totalPrice / result.data.length;

    // Determine number of volumes from the volume range (e.g. "1-10")
    const volumeParts = volumes.split('-');
    let volumeCount = 1;
    if (volumeParts.length === 2) {
      volumeCount = parseInt(volumeParts[1]) - parseInt(volumeParts[0]) + 1;
    }

    // Calculate price per volume
    const pricePerVolume = averageSetPrice / volumeCount;

    res.json({
      success: true,
      series,
      volumes,
      data: {
        averageSetPrice,
        pricePerVolume,
        priceTrend: 5.0, // Mock trend; update with real logic as needed
        numberOfListings: result.data.length,
        recentSales: result.data
      }
    });
  } catch (error) {
    console.error('Price check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
