const { Series, Volume, PriceHistory, CompletedSale, SaleVolume } = require('../models');
const { Op } = require('sequelize');

// Condition multipliers (adjust price based on condition)
const conditionMultipliers = {
  "like_new": 1.2,
  "very_good": 1.0,
  "good": 0.85,
  "acceptable": 0.7,
  "poor": 0.5
};

// Set premium factors - applies extra value for complete/continuous sets
const setPremiumFactors = {
  complete: 0.15, // 15% premium for complete sets
  continuous: 0.08 // 8% premium for continuous numbering
};

/**
 * Calculate the average price per volume for a manga series
 * @param {number} seriesId - The manga series ID
 * @param {string} condition - The condition of the manga
 * @returns {Promise<number>} - Average price per volume
 */
exports.calculateAveragePricePerVolume = async (seriesId, condition = "good") => {
  try {
    // Get all completed sales for this series
    const series = await Series.findByPk(seriesId);
    
    if (!series) {
      throw new Error(`Series with ID ${seriesId} not found`);
    }
    
    // Get sales data from completed_sales table via junction table
    const completedSales = await CompletedSale.findAll({
      include: [{
        model: SaleVolume,
        as: 'includedVolumes',
        include: [{
          model: Volume,
          as: 'volume',
          where: { series_id: seriesId }
        }]
      }],
      where: {
        sale_date: {
          // Get sales from last 90 days
          [Op.gte]: new Date(new Date() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // If no sales data, use default pricing
    if (completedSales.length === 0) {
      console.log('No sales data available, using default price');
      return 9.99; // Default average price
    }
    
    let totalPrice = 0;
    let totalVolumes = 0;
    
    // Process each sale
    for (const sale of completedSales) {
      // Number of volumes in this sale
      const volumeCount = sale.includedVolumes.length;
      
      if (volumeCount === 0) continue;
      
      // Normalize price by condition
      const normalizedPrice = sale.sale_price / conditionMultipliers[sale.condition];
      
      // Remove set premium if applicable
      let basePriceWithoutPremium = normalizedPrice;
      
      if (sale.is_complete_set) {
        basePriceWithoutPremium = normalizedPrice / (1 + setPremiumFactors.complete);
      } else if (volumeCount > 3) {
        // For partial sets with more than 3 volumes, remove continuous numbering premium
        basePriceWithoutPremium = normalizedPrice / (1 + setPremiumFactors.continuous);
      }
      
      totalPrice += basePriceWithoutPremium;
      totalVolumes += volumeCount;
    }
    
    // Calculate average price per volume
    const avgPricePerVolume = totalPrice / totalVolumes;
    
    // Apply condition multiplier for requested condition
    return avgPricePerVolume * conditionMultipliers[condition];
  } catch (error) {
    console.error('Error calculating average price per volume:', error);
    throw error;
  }
};

/**
 * Estimate the price for a specific manga set
 * @param {number} seriesId - The manga series ID
 * @param {number} startVol - Starting volume number
 * @param {number} endVol - Ending volume number
 * @param {string} condition - The condition of the manga
 * @param {boolean} isComplete - Whether this represents a complete set
 * @returns {Promise<object>} - Price details
 */
exports.estimateMangaSetPrice = async (seriesId, startVol, endVol, condition = "good", isComplete = false) => {
  try {
    // Calculate number of volumes
    const numVolumes = endVol - startVol + 1;
    
    // Check for exact match in price history
    const exactMatch = await findExactSetMatch(seriesId, startVol, endVol, condition);
    if (exactMatch) {
      return {
        estimatedPrice: exactMatch.set_price,
        pricePerVolume: exactMatch.avg_price_per_volume,
        numVolumes: numVolumes,
        premiumApplied: isComplete ? setPremiumFactors.complete : setPremiumFactors.continuous,
        condition: condition,
        matchType: 'exact'
      };
    }
    
    // Calculate based on average price per volume
    const avgPricePerVolume = await exports.calculateAveragePricePerVolume(seriesId, condition);
    
    // Base price without premiums
    let basePrice = avgPricePerVolume * numVolumes;
    
    // Apply premiums
    let premiumFactor = 0;
    if (isComplete) {
      premiumFactor = setPremiumFactors.complete;
    } else if (numVolumes > 3) {
      // Apply continuous numbering premium for sets with more than 3 volumes
      premiumFactor = setPremiumFactors.continuous;
    }
    
    const finalPrice = basePrice * (1 + premiumFactor);
    
    // Store this estimate in price history
    await PriceHistory.create({
      series_id: seriesId,
      start_volume: startVol,
      end_volume: endVol,
      avg_price_per_volume: avgPricePerVolume,
      set_price: finalPrice,
      is_complete_set: isComplete,
      condition: condition,
      source: 'algorithm'
    });
    
    return {
      estimatedPrice: finalPrice,
      pricePerVolume: avgPricePerVolume,
      numVolumes: numVolumes,
      premiumApplied: premiumFactor,
      condition: condition,
      matchType: 'calculated'
    };
  } catch (error) {
    console.error('Error estimating manga set price:', error);
    throw error;
  }
};

/**
 * Find an exact match for a specific set in price history
 * @param {number} seriesId - The manga series ID
 * @param {number} startVol - Starting volume number
 * @param {number} endVol - Ending volume number
 * @param {string} condition - The condition of the manga
 * @returns {Promise<object|null>} - Matching price history or null
 */
async function findExactSetMatch(seriesId, startVol, endVol, condition) {
  try {
    const match = await PriceHistory.findOne({
      where: {
        series_id: seriesId,
        start_volume: startVol,
        end_volume: endVol,
        condition: condition,
        // Find a recent price record (last 30 days)
        record_date: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['record_date', 'DESC']]
    });
    
    return match;
  } catch (error) {
    console.error('Error finding exact set match:', error);
    return null;
  }
}

/**
 * Calculate price for a set with missing volumes
 * @param {number} seriesId - The manga series ID
 * @param {Array<number>} volumes - Array of volume numbers
 * @param {string} condition - The condition of the manga
 * @returns {Promise<object>} - Price details
 */
exports.calculatePriceWithMissingVolumes = async (seriesId, volumes, condition = "good") => {
  try {
    // Get series info to check if this is a complete set
    const series = await Series.findByPk(seriesId);
    
    if (!series) {
      throw new Error(`Series with ID ${seriesId} not found`);
    }
    
    const isPartOfComplete = volumes.length === series.total_volumes;
    
    // Sort volumes
    volumes.sort((a, b) => a - b);
    
    // Identify continuous ranges
    const ranges = [];
    let currentRange = [volumes[0]];
    
    for (let i = 1; i < volumes.length; i++) {
      if (volumes[i] === volumes[i-1] + 1) {
        // Continuous, add to current range
        currentRange.push(volumes[i]);
      } else {
        // Gap found, start new range
        ranges.push([...currentRange]);
        currentRange = [volumes[i]];
      }
    }
    
    // Add the last range
    if (currentRange.length > 0) {
      ranges.push(currentRange);
    }
    
    let totalPrice = 0;
    let totalVolumes = 0;
    
    // Calculate price for each continuous range
    for (const range of ranges) {
      const rangeEstimate = await exports.estimateMangaSetPrice(
        seriesId, 
        range[0], 
        range[range.length - 1], 
        condition,
        isPartOfComplete && range.length > 3
      );
      
      totalPrice += rangeEstimate.estimatedPrice;
      totalVolumes += rangeEstimate.numVolumes;
    }
    
    // Apply a small discount if there are multiple discontinuous ranges
    let discontinuityDiscount = 0;
    if (ranges.length > 1) {
      discontinuityDiscount = 0.05; // 5% discount for discontinuous set
    }
    
    const finalPrice = totalPrice * (1 - discontinuityDiscount);
    
    return {
      estimatedPrice: finalPrice,
      pricePerVolume: totalPrice / totalVolumes,
      numVolumes: totalVolumes,
      numRanges: ranges.length,
      discontinuityDiscount: discontinuityDiscount,
      condition: condition
    };
  } catch (error) {
    console.error('Error calculating price with missing volumes:', error);
    throw error;
  }
};

/**
 * Calculate trending price movement for a series
 * @param {number} seriesId - The manga series ID
 * @param {number} days - Number of days to analyze
 * @returns {Promise<object>} - Price trend data
 */
exports.calculatePriceTrend = async (seriesId, days = 30) => {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    const olderCutoffDate = new Date(new Date().setDate(new Date().getDate() - (days * 2)));
    
    // Get recent price history
    const recentPrices = await PriceHistory.findAll({
      where: {
        series_id: seriesId,
        record_date: {
          [Op.between]: [cutoffDate, new Date()]
        }
      }
    });
    
    // Get older price history for comparison
    const olderPrices = await PriceHistory.findAll({
      where: {
        series_id: seriesId,
        record_date: {
          [Op.between]: [olderCutoffDate, cutoffDate]
        }
      }
    });
    
    if (recentPrices.length === 0 || olderPrices.length === 0) {
      return {
        trend: 0,
        confidence: "low",
        message: "Insufficient data for trend analysis"
      };
    }
    
    // Calculate average prices
    const avgRecentPrice = recentPrices.reduce((sum, item) => sum + parseFloat(item.avg_price_per_volume), 0) / recentPrices.length;
    const avgOlderPrice = olderPrices.reduce((sum, item) => sum + parseFloat(item.avg_price_per_volume), 0) / olderPrices.length;
    
    // Calculate price change percentage
    const priceChange = ((avgRecentPrice - avgOlderPrice) / avgOlderPrice) * 100;
    
    // Determine confidence level based on sample size
    let confidence = "low";
    if (recentPrices.length >= 10 && olderPrices.length >= 10) {
      confidence = "high";
    } else if (recentPrices.length >= 5 && olderPrices.length >= 5) {
      confidence = "medium";
    }
    
    return {
      trend: priceChange,
      avgRecentPrice: avgRecentPrice,
      avgOlderPrice: avgOlderPrice,
      recentSamples: recentPrices.length,
      olderSamples: olderPrices.length,
      confidence: confidence
    };
  } catch (error) {
    console.error('Error calculating price trend:', error);
    throw error;
  }
};