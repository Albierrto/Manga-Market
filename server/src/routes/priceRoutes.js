// src/routes/priceRoutes.js
const express = require('express');
const router = express.Router();
const { fetchEbayPrices } = require('../services/ebayService');

// GET /api/prices - Get manga prices from eBay
router.get('/prices', async (req, res) => {
  try {
    const { series, volumes, totalVolumes, condition = 'good' } = req.query;
    
    if (!series || !volumes) {
      return res.status(400).json({ 
        message: 'Series name and volume range are required' 
      });
    }

    // Parse volume range (e.g., "1-3")
    let volumeStart, volumeEnd;
    if (volumes.includes('-')) {
      [volumeStart, volumeEnd] = volumes.split('-').map(v => parseInt(v));
    } else {
      volumeStart = parseInt(volumes);
      volumeEnd = volumeStart;
    }

    // Calculate total if not provided
    const totalVols = totalVolumes ? parseInt(totalVolumes) : (volumeEnd - volumeStart + 1);

    // Fetch data from eBay
    const priceData = await fetchEbayPrices(series, volumeStart, volumeEnd, condition);

    // Return formatted results
    res.json({
      success: true,
      series,
      volumes,
      data: {
        averageSetPrice: priceData.averagePrice,
        pricePerVolume: priceData.averagePrice / totalVols,
        priceTrend: priceData.priceTrend,
        numberOfListings: priceData.numberOfListings,
        recentSales: priceData.recentSales || []
      }
    });
  } catch (error) {
    console.error('Price check error:', error);
    res.status(500).json({ 
      message: error.message || 'Error fetching price data from eBay',
      success: false
    });
  }
});

module.exports = router;