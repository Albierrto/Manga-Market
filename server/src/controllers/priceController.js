const { Series, Volume } = require('../models');
const pricingService = require('../services/pricingService');

/**
 * Check price for a manga set
 * @route POST /api/price-check
 */
exports.checkPrice = async (req, res, next) => {
  try {
    const { seriesId, volumes, condition = 'good' } = req.body;
    
    // Validate parameters
    if (!seriesId) {
      return res.status(400).json({
        success: false,
        error: 'Series ID is required'
      });
    }
    
    if (!volumes) {
      return res.status(400).json({
        success: false,
        error: 'Volumes information is required'
      });
    }
    
    // Get series information
    const series = await Series.findByPk(seriesId);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    let priceEstimate;
    
    // Handle different volume specifications
    if (Array.isArray(volumes)) {
      // Specific volumes were provided
      priceEstimate = await pricingService.calculatePriceWithMissingVolumes(
        seriesId,
        volumes,
        condition
      );
    } else if (volumes.start && volumes.end) {
      // Volume range was provided
      const isComplete = volumes.start === 1 && volumes.end === series.total_volumes;
      
      priceEstimate = await pricingService.estimateMangaSetPrice(
        seriesId,
        volumes.start,
        volumes.end,
        condition,
        isComplete
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid volumes format. Provide either an array of volumes or start/end range.'
      });
    }
    
    // Calculate price trends
    const priceTrend = await pricingService.calculatePriceTrend(seriesId, 30);
    
    res.json({
      success: true,
      data: {
        series: {
          id: series.series_id,
          name: series.name,
          totalVolumes: series.total_volumes
        },
        priceEstimate,
        priceTrend,
        condition
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    next(error);
  }
};

/**
 * Get price trend for a series
 * @route GET /api/price-trend/:seriesId
 */
exports.getPriceTrend = async (req, res, next) => {
  try {
    const seriesId = req.params.seriesId;
    const days = parseInt(req.query.days) || 30;
    
    // Get series information
    const series = await Series.findByPk(seriesId);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    // Calculate price trends
    const priceTrend = await pricingService.calculatePriceTrend(seriesId, days);
    
    res.json({
      success: true,
      data: {
        series: {
          id: series.series_id,
          name: series.name
        },
        priceTrend
      }
    });
  } catch (error) {
    console.error('Error getting price trend:', error);
    next(error);
  }
};