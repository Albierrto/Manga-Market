// server/src/routes/priceRoutes.js

const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricingService'); // Use the service that uses the DB
const { Series, Volume } = require('../models'); // Need Series model for lookup
const { Op } = require('sequelize'); // For more complex queries if needed

// GET /api/prices - Get calculated manga prices based on DB data
router.get('/prices', async (req, res) => {
  try {
    const { seriesName, volumes, condition = 'good' } = req.query; // condition defaults to 'good'

    if (!seriesName) {
      return res.status(400).json({ success: false, message: 'Query parameter "seriesName" is required.' });
    }
    if (!volumes) {
      return res.status(400).json({ success: false, message: 'Query parameter "volumes" is required (e.g., "1", "1-10", "1,3,5").' });
    }

    // 1. Find the Series ID based on the name
    const series = await Series.findOne({
      where: {
        // Use case-insensitive matching if needed, depends on your DB collation
        // name: { [Op.iLike]: seriesName } // For PostgreSQL iLike
        name: seriesName // Adjust if case-sensitive matching is okay
       }
    });

    if (!series) {
      return res.status(404).json({ success: false, message: `Series "${seriesName}" not found in the database.` });
    }
    const seriesId = series.series_id;
    const totalVolumesInSeries = series.total_volumes;

    let priceData = {};
    let calculationType = 'unknown';

    // 2. Parse the 'volumes' parameter and call the appropriate pricing service function
    if (/^\d+$/.test(volumes)) {
      // Single volume (e.g., "5")
      calculationType = 'single_volume';
      const volumeNum = parseInt(volumes, 10);
      // Check if it's the complete set (only 1 volume total)
      const isComplete = totalVolumesInSeries === 1 && volumeNum === 1;
       // Use estimateMangaSetPrice for a single volume range
      priceData = await pricingService.estimateMangaSetPrice(seriesId, volumeNum, volumeNum, condition, isComplete);

    } else if (/^\d+-\d+$/.test(volumes)) {
      // Volume range (e.g., "1-10")
      calculationType = 'volume_range';
      const [startVol, endVol] = volumes.split('-').map(Number);
      if (startVol >= endVol || startVol < 1) {
         return res.status(400).json({ success: false, message: 'Invalid volume range format or values.' });
      }
      // Check if the range represents the complete set
      const isComplete = startVol === 1 && endVol === totalVolumesInSeries;
      priceData = await pricingService.estimateMangaSetPrice(seriesId, startVol, endVol, condition, isComplete);

    } else if (/^(\d+,)*\d+$/.test(volumes)) {
      // Comma-separated list of volumes (e.g., "1,3,5")
      calculationType = 'volume_list';
      const volumeList = volumes.split(',').map(Number).sort((a, b) => a - b);
      if (volumeList.some(isNaN) || volumeList.length === 0) {
         return res.status(400).json({ success: false, message: 'Invalid volume list format.' });
      }
      priceData = await pricingService.calculatePriceWithMissingVolumes(seriesId, volumeList, condition);

    } else {
       return res.status(400).json({ success: false, message: 'Invalid "volumes" query parameter format. Use "1", "1-10", or "1,3,5".' });
    }

    // Optionally, get trend data
    const trendData = await pricingService.calculatePriceTrend(seriesId);

    // 3. Send the response
    res.status(200).json({
      success: true,
      series: {
          id: seriesId,
          name: series.name,
          totalVolumes: totalVolumesInSeries
      },
      query: {
          volumes: volumes,
          condition: condition,
          type: calculationType
      },
      pricing: priceData, // Contains estimatedPrice, pricePerVolume, etc. from the service
      trend: trendData
    });

  } catch (error) {
    console.error('Error in /api/prices route:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error while calculating prices.',
        error: error.message // Provide error message in development?
    });
  }
});

module.exports = router;