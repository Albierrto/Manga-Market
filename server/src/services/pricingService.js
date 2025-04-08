// server/src/services/pricingService.js - Rewritten April 8, 2025
// - Outlier Filter: Keep price/vol between $1 and $20.
// - No Premiums: Removed Complete Set / Continuous Range premiums.
// - Keep Condition Multipliers.

const { Series, Volume, PriceHistory, CompletedSale, SaleVolume } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Condition multipliers (STILL USED)
const conditionMultipliers = {
  "like_new": 1.2,
  "very_good": 1.0,
  "good": 0.85,
  "acceptable": 0.7,
  "poor": 0.5
};

// Set premium factors (NO LONGER USED - kept for reference or potential future use)
// const setPremiumFactors = {
//   complete: 0.15,
//   continuous: 0.08
// };

/**
 * Calculates the average price per volume for a manga series,
 * filtering for prices between $1 and $20 per volume.
 * @param {number} seriesId - The manga series ID
 * @param {string} condition - The condition of the manga to estimate for (used only at the end)
 * @returns {Promise<number>} - Average base price per volume (for 'Very Good' condition equivalent)
 */
exports.calculateAveragePricePerVolume = async (seriesId, condition = "good") => { // condition param needed for final multiplier, but calculation uses base price
  try {
    const series = await Series.findByPk(seriesId);
    if (!series) {
      throw new Error(`Series with ID ${seriesId} not found`);
    }

    const completedSales = await CompletedSale.findAll({
      include: [{
        model: SaleVolume,
        as: 'includedVolumes',
        required: true,
        include: [{
          model: Volume,
          as: 'volume',
          where: { series_id: seriesId },
          required: true
        }]
      }],
      where: {
        sale_date: {
          [Op.gte]: new Date(new Date() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
    });

    if (!completedSales || completedSales.length === 0) {
      console.warn(`[pricingService] No completed sales with linked volumes found for Series ID ${seriesId} in the last 90 days. Using default price.`);
      // Return default base price (equivalent to $9.99 for 'Very Good')
      return 9.99;
    }

    let validPricesPerVolume = [];
    console.log(`[pricingService] Found ${completedSales.length} sales with linked volumes for potential averaging for Series ID ${seriesId}.`);

    // 1. Calculate normalized price per volume for each sale & apply $1-$20 filter
    for (const sale of completedSales) {
       if (!Array.isArray(sale.includedVolumes) || sale.includedVolumes.length === 0) {
           console.warn(`[pricingService] Sale ID ${sale.sale_id} unexpectedly has no linked volumes after query. Skipping.`);
           continue;
       }
      const volumeCount = sale.includedVolumes.length;
      const saleConditionMultiplier = conditionMultipliers[sale.condition] || conditionMultipliers['good'];
      const salePrice = parseFloat(sale.sale_price);

      if (isNaN(salePrice) || salePrice <= 0) {
           console.warn(`[pricingService] Invalid sale price (${sale.sale_price}) for Sale ID ${sale.sale_id}. Skipping.`);
           continue;
      }

      // Calculate price normalized to 'Very Good' condition (multiplier 1.0)
      const normalizedPrice = salePrice / saleConditionMultiplier;

      // NO LONGER remove set premium here

      const pricePerVol = normalizedPrice / volumeCount;

      // Apply the $1 - $20 filter
      if (pricePerVol >= 1 && pricePerVol <= 20) {
           validPricesPerVolume.push(pricePerVol);
      } else {
           console.log(`[pricingService] Excluding sale (Filter Price/Vol: ${pricePerVol.toFixed(2)}) - Sale ID: ${sale.sale_id}, Orig Price: ${sale.sale_price}, Vols: ${volumeCount}`);
      }
    }

    if (validPricesPerVolume.length === 0) {
        console.warn(`[pricingService] No sales remaining after $1-$20 price/volume filter for Series ID ${seriesId}. Using default price.`);
        return 9.99; // Default base price
    }

    // 2. Calculate the average of the valid prices
    const averageFilteredPricePerVolume = validPricesPerVolume.reduce((sum, price) => sum + price, 0) / validPricesPerVolume.length;

    console.log(`[pricingService] Calculated Average Base Price Per Volume (Filtered $1-$20): ${averageFilteredPricePerVolume.toFixed(2)} from ${validPricesPerVolume.length} sales.`);

    // 3. Return the average base price (equivalent to 'Very Good').
    // The condition multiplier for the *requested* condition will be applied in estimateMangaSetPrice.
    return averageFilteredPricePerVolume;

  } catch (error) {
    console.error(`[pricingService] Error calculating average price per volume for Series ID ${seriesId}:`, error);
    console.warn(`[pricingService] Calculation failed for Series ID ${seriesId}, returning default price.`);
    return 9.99; // Default base price on error
  }
};


/**
 * Find an exact match for a specific set in price history (Locally Scoped Helper)
 */
async function findExactSetMatch(seriesId, startVol, endVol, condition) {
   try {
     const match = await PriceHistory.findOne({
       where: {
         series_id: seriesId,
         start_volume: startVol,
         end_volume: endVol,
         condition: condition,
         record_date: {
           [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
         }
       },
       order: [['record_date', 'DESC']]
     });
     return match;
   } catch (error) {
     console.error('[pricingService] Error finding exact set match:', error);
     return null;
   }
 }


/**
 * Estimate the price for a specific manga set based on average price and condition.
 * NO LONGER APPLIES COMPLETENESS/CONTINUOUS PREMIUMS.
 * @param {number} seriesId - The manga series ID
 * @param {number} startVol - Starting volume number
 * @param {number} endVol - Ending volume number
 * @param {string} condition - The condition of the manga
 * @param {boolean} isComplete - Whether this represents a complete set (ignored for premium, used for history)
 * @returns {Promise<object>} - Price details
 */
exports.estimateMangaSetPrice = async (seriesId, startVol, endVol, condition = "good", isComplete = false) => { // isComplete param is kept but not used for premium
  try {
    const numVolumes = endVol - startVol + 1;

    // Check for exact match in price history first (optional, can be removed if desired)
    const exactMatch = await findExactSetMatch(seriesId, startVol, endVol, condition);
    if (exactMatch) {
       console.log(`[pricingService] Found exact match in PriceHistory for Series ${seriesId}, Vols ${startVol}-${endVol}, Cond: ${condition}`);
       const estimatedPrice = parseFloat(exactMatch.set_price);
       const pricePerVolume = parseFloat(exactMatch.avg_price_per_volume);

       if (isNaN(estimatedPrice) || isNaN(pricePerVolume)) {
           console.warn("[pricingService] Invalid number found in exact PriceHistory match. Recalculating...");
           // Fall through to recalculate
       } else {
           // Return the stored match, noting premium applied is now always 0
           return {
               estimatedPrice: estimatedPrice,
               pricePerVolume: pricePerVolume,
               numVolumes: numVolumes,
               premiumApplied: 0, // No premium applied in current logic
               condition: exactMatch.condition,
               matchType: 'exact'
           };
       }
    }

    console.log(`[pricingService] No exact match found. Calculating price for Series ${seriesId}, Vols ${startVol}-${endVol}, Cond: ${condition}`);
    // Calculate base average price per volume (filtered $1-$20, 'Very Good' equivalent)
    const avgBasePricePerVolume = await exports.calculateAveragePricePerVolume(seriesId, condition); // Pass condition for potential use inside if needed, but result is base

    if (isNaN(avgBasePricePerVolume) || avgBasePricePerVolume <= 0) {
         console.warn(`[pricingService] Invalid avgBasePricePerVolume (${avgBasePricePerVolume}) received. Returning zero estimate.`);
         return { estimatedPrice: 0, pricePerVolume: 0, numVolumes: numVolumes, premiumApplied: 0, condition: condition, matchType: 'calculation_error' };
    }

    // Calculate base price for the set
    let basePrice = avgBasePricePerVolume * numVolumes;

    // NO LONGER APPLY PREMIUMS
    // let premiumFactor = 0;
    // if (isComplete) { premiumFactor = setPremiumFactors.complete; }
    // else if (numVolumes > 1) { premiumFactor = setPremiumFactors.continuous; }
    // const priceBeforeCondition = basePrice * (1 + premiumFactor);

    const priceBeforeCondition = basePrice; // Price is now just base average * volume count

    // APPLY condition multiplier for the requested condition
    const finalPrice = priceBeforeCondition * (conditionMultipliers[condition] || 1.0);
    const finalPricePerVolume = avgBasePricePerVolume * (conditionMultipliers[condition] || 1.0); // Apply condition to avg too

    console.log(`[pricingService] Calculated Price - AvgBasePerVol: ${avgBasePricePerVolume.toFixed(2)}, BaseSetPrice: ${basePrice.toFixed(2)}, ConditionMultiplier: ${conditionMultipliers[condition] || 1.0}, Final: ${finalPrice.toFixed(2)}`);

     // Store this estimate in price history
     try {
         await PriceHistory.create({
           series_id: seriesId,
           start_volume: startVol,
           end_volume: endVol,
           avg_price_per_volume: finalPricePerVolume, // Store condition-adjusted average
           set_price: finalPrice,
           is_complete_set: isComplete, // Still useful to store if the range was complete
           condition: condition,
           source: 'algorithm'
         });
     } catch(histError) {
         console.error("[pricingService] Error saving calculated price to PriceHistory:", histError);
     }

    return {
      estimatedPrice: finalPrice,
      pricePerVolume: finalPricePerVolume, // Return condition-adjusted average
      numVolumes: numVolumes,
      premiumApplied: 0, // Always 0 now
      condition: condition,
      matchType: 'calculated'
    };
  } catch (error) {
    console.error('[pricingService] Error estimating manga set price:', error);
    throw error; // Re-throw error to be caught by route handler
  }
};

/**
 * Calculate price for a set with missing volumes
 */
exports.calculatePriceWithMissingVolumes = async (seriesId, volumes, condition = "good") => {
    // This function should now work correctly as it relies on estimateMangaSetPrice,
    // which no longer applies the set premiums internally.
    try {
        const series = await Series.findByPk(seriesId);
        if (!series) throw new Error(`Series with ID ${seriesId} not found`);
        if (!Array.isArray(volumes)) throw new Error("Volumes parameter must be an array.");
        volumes.sort((a, b) => a - b);
        if (volumes.length === 0) throw new Error("Volumes array cannot be empty.");

        const totalVolumesInSeries = series.total_volumes ? parseInt(series.total_volumes, 10) : 0;
        // Check if the list provided *could* be complete (useful for history, not for premium)
        const isPotentiallyComplete = totalVolumesInSeries > 0 && volumes.length === totalVolumesInSeries && volumes[0] === 1 && volumes[volumes.length - 1] === totalVolumesInSeries;

        const ranges = [];
        if (volumes.length > 0) {
            let currentRange = [volumes[0]];
            for (let i = 1; i < volumes.length; i++) {
                if (volumes[i] === volumes[i - 1] + 1) currentRange.push(volumes[i]);
                else { ranges.push([...currentRange]); currentRange = [volumes[i]]; }
            }
            ranges.push([...currentRange]);
        }

        let totalEstimatedPrice = 0;
        let totalCalculatedVolumes = 0;
        let effectiveAvgPricePerVolSum = 0;

        for (const range of ranges) {
            const startVol = range[0];
            const endVol = range[range.length - 1];
            // Determine if this specific sub-range happens to be the complete set
            const isThisRangeTheCompleteSet = isPotentiallyComplete && startVol === 1 && endVol === totalVolumesInSeries;

            // Call the updated estimate function (which ignores isComplete for premiums)
            const rangeEstimate = await exports.estimateMangaSetPrice(seriesId, startVol, endVol, condition, isThisRangeTheCompleteSet);
            const estimatedPriceNum = parseFloat(rangeEstimate.estimatedPrice);

            if (!isNaN(estimatedPriceNum)) {
                totalEstimatedPrice += estimatedPriceNum;
                totalCalculatedVolumes += rangeEstimate.numVolumes;
                 const rangeAvgPriceNum = parseFloat(rangeEstimate.pricePerVolume);
                 if (!isNaN(rangeAvgPriceNum)){
                     effectiveAvgPricePerVolSum += rangeAvgPriceNum * rangeEstimate.numVolumes;
                 }
            } else {
                console.warn(`[pricingService] Received non-numeric estimated price for range ${startVol}-${endVol} in list calculation.`);
            }
        }

        const effectivePricePerVolume = totalCalculatedVolumes > 0 ? effectiveAvgPricePerVolSum / totalCalculatedVolumes : 0;
        let discontinuityDiscountFactor = 0;
        if (ranges.length > 1) discontinuityDiscountFactor = 0.05;
        const finalPrice = totalEstimatedPrice * (1 - discontinuityDiscountFactor);

        return {
            estimatedPrice: finalPrice,
            pricePerVolume: effectivePricePerVolume,
            numVolumes: totalCalculatedVolumes,
            numRanges: ranges.length,
            discontinuityDiscount: discontinuityDiscountFactor,
            condition: condition,
            matchType: 'calculated_list'
        };
    } catch (error) {
        console.error('[pricingService] Error calculating price with missing volumes:', error);
        throw error;
    }
};


/**
 * Calculate trending price movement for a series
 */
exports.calculatePriceTrend = async (seriesId, days = 30) => {
   // This function remains unchanged as it uses historical averages
   try {
     const recentEndDate = new Date();
     const recentStartDate = new Date(new Date().setDate(recentEndDate.getDate() - days));
     const olderStartDate = new Date(new Date().setDate(recentEndDate.getDate() - (days * 2)));
     const olderEndDate = recentStartDate;

     // Fetch prices ensuring they are valid numbers
     const fetchValidPrices = async (startDate, endDate) => {
        const prices = await PriceHistory.findAll({
          where: {
            series_id: seriesId,
            record_date: { [Op.between]: [startDate, endDate] },
            avg_price_per_volume: { [Op.ne]: null, [Op.gt]: 0 } // Ensure price is valid number > 0
          }
        });
        // Filter out any potential non-numeric values just in case
        return prices.map(item => parseFloat(item.avg_price_per_volume)).filter(price => !isNaN(price) && price > 0);
     };

     const recentValidPrices = await fetchValidPrices(recentStartDate, recentEndDate);
     const olderValidPrices = await fetchValidPrices(olderStartDate, olderEndDate);


     const minSamples = 2;
     if (recentValidPrices.length < minSamples || olderValidPrices.length < minSamples) {
        console.log(`[pricingService] Trend: Insufficient data. Recent: ${recentValidPrices.length}, Older: ${olderValidPrices.length}. Min required: ${minSamples}`);
       return { trend: 0, confidence: "low", recentSamples: recentValidPrices.length, olderSamples: olderValidPrices.length, message: `Insufficient data (need >=${minSamples} samples in each ${days}-day period)` };
     }

     const avgRecentPrice = recentValidPrices.reduce((sum, price) => sum + price, 0) / recentValidPrices.length;
     const avgOlderPrice = olderValidPrices.reduce((sum, price) => sum + price, 0) / olderValidPrices.length;

     if (avgOlderPrice === 0) { // Check explicitly for zero after filtering
         return { trend: 0, confidence: "low", message: "Older period average price is zero.", recentSamples: recentValidPrices.length, olderSamples: olderValidPrices.length };
     }

     const priceChange = ((avgRecentPrice - avgOlderPrice) / avgOlderPrice) * 100;
     let confidence = "low";
     if (recentValidPrices.length >= 10 && olderValidPrices.length >= 10) confidence = "high";
     else if (recentValidPrices.length >= 5 && olderValidPrices.length >= 5) confidence = "medium";

     console.log(`[pricingService] Trend calculation for Series ${seriesId}: Recent Avg (${recentValidPrices.length}) = ${avgRecentPrice.toFixed(2)}, Older Avg (${olderValidPrices.length}) = ${avgOlderPrice.toFixed(2)}, Trend = ${priceChange.toFixed(2)}%`);

     return { trend: priceChange, avgRecentPrice: avgRecentPrice, avgOlderPrice: avgOlderPrice, recentSamples: recentValidPrices.length, olderSamples: olderValidPrices.length, confidence: confidence };
   } catch (error) {
     console.error('[pricingService] Error calculating price trend:', error);
     return { trend: 0, confidence: "error", message: "Error during calculation", recentSamples: 0, olderSamples: 0 };
   }
 };

// NO 'module.exports = { ... }' block should be here.
// Defining functions on 'exports.' automatically exports them.