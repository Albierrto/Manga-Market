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

    // Call the eBay service function.
    const result = await ebayService.searchCompletedMangaSets(series, volumes);

    // Check if there are any items returned
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

    // Calculate total price by parsing the price from each item's sellingStatus field
    const totalPrice = result.data.reduce((sum, item) => {
      const price = parseFloat(item.sellingStatus[0].convertedCurrentPrice[0].__value__) || 0;
      return sum + price;
    }, 0);

    // Compute average set price
    const averageSetPrice = totalPrice / result.data.length;

    // Determine the number of volumes from the provided volume range (e.g., "1-10")
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
        priceTrend: 5.0, // This is a mocked trend value; update as needed
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
