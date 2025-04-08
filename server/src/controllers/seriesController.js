// server/src/controllers/seriesController.js - ADDED More Logging for Debugging

const { Series } = require('../models');
const aiSummaryService = require('../services/aiSummaryService');
const pricingService = require('../services/pricingService');

// Define conditionMultipliers locally
const conditionMultipliers = {
  "like_new": 1.2, "very_good": 1.0, "good": 0.85, "acceptable": 0.7, "poor": 0.5
};

// GET all series WITH calculated pricing info AND logging
exports.getAllSeries = async (req, res, next) => {
  try {
    console.log("[seriesController] Fetching all series from DB...");
    const seriesList = await Series.findAll({
      order: [['name', 'ASC']],
    });
    console.log(`[seriesController] Found ${seriesList.length} series in DB.`);

    if (!seriesList || seriesList.length === 0) {
        console.log("[seriesController] No series found in DB. Sending empty list.");
        return res.status(200).json({ success: true, count: 0, data: [] });
    }

    console.log("[seriesController] Calculating pricing for each series...");
    const seriesWithPricing = await Promise.all(seriesList.map(async (series) => {
      // *** ADDED: Log which series is being processed ***
      console.log(`[seriesController] Processing series ID: ${series.series_id}, Name: ${series.name}`);
      try {
          const baseAvgPricePerVol = await pricingService.calculateAveragePricePerVolume(series.series_id);
          const goodConditionMultiplier = conditionMultipliers['good'] || 0.85;
          const goodAvgPricePerVol = baseAvgPricePerVol * goodConditionMultiplier;
          const totalVolumes = series.total_volumes ? parseInt(series.total_volumes, 10) : 0;
          let goodCompleteSetPrice = 0;
          if (totalVolumes > 0 && !isNaN(baseAvgPricePerVol) && baseAvgPricePerVol > 0) {
             goodCompleteSetPrice = (baseAvgPricePerVol * totalVolumes) * goodConditionMultiplier;
          }

          // *** ADDED: Log the image URL being used ***
          const imageUrl = series.image_url || '/images/placeholder.jpg';
          console.log(`[seriesController]   -> Image URL for ${series.name}: ${imageUrl}`);

          // Return the enriched object
          return {
            ...series.get({ plain: true }),
            id: series.series_id,
            volumes: totalVolumes,
            averagePricePerVolGood: !isNaN(goodAvgPricePerVol) ? goodAvgPricePerVol : 0,
            completeSetPriceGood: !isNaN(goodCompleteSetPrice) ? goodCompleteSetPrice : 0,
            image: imageUrl // Map image_url to image for frontend
          };
      } catch (pricingError) {
          // *** ADDED: Log errors during pricing calculation for a specific series ***
          console.error(`[seriesController] Error calculating price for Series ID: ${series.series_id} (${series.name}):`, pricingError);
          // Return the series data without pricing info, or null, or throw? Returning without price for now.
          return {
             ...series.get({ plain: true }),
             id: series.series_id,
             volumes: series.total_volumes ? parseInt(series.total_volumes, 10) : 0,
             averagePricePerVolGood: 0, // Indicate missing price
             completeSetPriceGood: 0,   // Indicate missing price
             image: series.image_url || '/images/placeholder.jpg',
             pricingError: true // Add a flag
          };
      }
    }));

    // *** ADDED: Log the final data being sent ***
    console.log(`[seriesController] Finished calculating. Final data count: ${seriesWithPricing.filter(s => s !== null).length}`); // Filter out potential nulls if error handling changes
    // console.log("[seriesController] Final data being sent:", JSON.stringify(seriesWithPricing, null, 2)); // Optional: Log full data (can be large)


    res.status(200).json({
      success: true,
      count: seriesWithPricing.length,
      data: seriesWithPricing
    });

  } catch (error) {
    console.error('[seriesController] Error fetching all series:', error);
    next(error);
  }
};

// --- Keep other functions (getSeriesById, createSeries, etc.) exactly as they were ---
exports.getSeriesById = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) { return res.status(404).json({ success: false, error: 'Series not found' }); }
    if (!series.summary) {
      try {
        console.log(`[seriesController] Generating summary for Series ID: ${series.series_id}`);
        const summary = await aiSummaryService.generateSeriesSummary( series.name, series.publisher, series.total_volumes );
        await series.update({ summary }); series.summary = summary;
        console.log(`[seriesController] Summary generated and updated for Series ID: ${series.series_id}`);
      } catch (summaryError) { console.error(`[seriesController] Error generating summary for Series ID ${series.series_id}:`, summaryError); }
    }
    res.status(200).json({ success: true, data: series });
  } catch (error) { console.error('[seriesController] Error fetching series by ID:', error); next(error); }
};
exports.createSeries = async (req, res, next) => {
  try {
    const series = await Series.create(req.body);
    if (!req.body.summary) {
      try {
        console.log(`[seriesController] Generating summary for newly created Series ID: ${series.series_id}`);
        const summary = await aiSummaryService.generateSeriesSummary( series.name, series.publisher, series.total_volumes );
        await series.update({ summary }); series.summary = summary;
        console.log(`[seriesController] Summary generated and updated for Series ID: ${series.series_id}`);
      } catch (summaryError) { console.error(`[seriesController] Error generating summary during creation for Series ID ${series.series_id}:`, summaryError); }
    }
    res.status(201).json({ success: true, data: series });
  } catch (error) {
    console.error('[seriesController] Error creating series:', error);
     if (error.name === 'SequelizeUniqueConstraintError') { return res.status(400).json({ success: false, message: 'Series with this name might already exist.', fields: error.fields }); }
     else if (error.name === 'SequelizeValidationError') { return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors.map(e => e.message) }); }
    next(error);
  }
};
exports.updateSeries = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) { return res.status(404).json({ success: false, error: 'Series not found' }); }
    const originalName = series.name; const originalPublisher = series.publisher; const originalTotalVolumes = series.total_volumes;
    await series.update(req.body);
    const nameChanged = req.body.name && req.body.name !== originalName;
    const publisherChanged = req.body.publisher && req.body.publisher !== originalPublisher;
    const volumesChanged = req.body.total_volumes && req.body.total_volumes !== originalTotalVolumes;
    if (nameChanged || publisherChanged || volumesChanged) {
      try {
        console.log(`[seriesController] Regenerating summary for updated Series ID: ${series.series_id}`);
        const summary = await aiSummaryService.generateSeriesSummary( series.name, series.publisher, series.total_volumes );
        await series.update({ summary }); series.summary = summary;
        console.log(`[seriesController] Summary regenerated and updated for Series ID: ${series.series_id}`);
      } catch (summaryError) { console.error(`[seriesController] Error regenerating summary during update for Series ID ${series.series_id}:`, summaryError); }
    }
    res.status(200).json({ success: true, data: series });
  } catch (error) {
    console.error('[seriesController] Error updating series:', error);
     if (error.name === 'SequelizeUniqueConstraintError') { return res.status(400).json({ success: false, message: 'Series with this name might already exist.', fields: error.fields }); }
     else if (error.name === 'SequelizeValidationError') { return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors.map(e => e.message) }); }
    next(error);
  }
};
exports.deleteSeries = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    if (!series) { return res.status(404).json({ success: false, error: 'Series not found' }); }
    await series.destroy();
    console.log(`[seriesController] Deleted Series ID: ${req.params.id}`);
    res.status(200).json({ success: true, data: {} });
  } catch (error) { console.error('[seriesController] Error deleting series:', error); next(error); }
};