// server/src/controllers/seriesController.js - Update to include summaries
const { Series } = require('../models');
const aiSummaryService = require('../services/aiSummaryService');

// Get all series
exports.getAllSeries = async (req, res, next) => {
  try {
    const series = await Series.findAll();
    
    res.status(200).json({
      success: true,
      count: series.length,
      data: series
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    next(error);
  }
};

// Get single series by ID
exports.getSeriesById = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    // Check if summary exists, if not, generate one
    if (!series.summary) {
      try {
        const summary = await aiSummaryService.generateSeriesSummary(
          series.name,
          series.publisher,
          series.total_volumes
        );
        
        // Update the series with the new summary
        await series.update({ summary });
        
        // Refresh the series object
        series.summary = summary;
      } catch (summaryError) {
        console.error('Error generating summary:', summaryError);
        // Continue without summary if generation fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('Error fetching series by ID:', error);
    next(error);
  }
};

// Create new series
exports.createSeries = async (req, res, next) => {
  try {
    const series = await Series.create(req.body);
    
    // Generate summary if not provided
    if (!req.body.summary) {
      try {
        const summary = await aiSummaryService.generateSeriesSummary(
          series.name,
          series.publisher,
          series.total_volumes
        );
        
        await series.update({ summary });
        series.summary = summary;
      } catch (summaryError) {
        console.error('Error generating summary during creation:', summaryError);
        // Continue without summary if generation fails
      }
    }
    
    res.status(201).json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('Error creating series:', error);
    next(error);
  }
};

// Update series
exports.updateSeries = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    await series.update(req.body);
    
    // Regenerate summary if name or publisher changed
    if ((req.body.name && req.body.name !== series.name) || 
        (req.body.publisher && req.body.publisher !== series.publisher) ||
        (req.body.total_volumes && req.body.total_volumes !== series.total_volumes)) {
      try {
        const summary = await aiSummaryService.generateSeriesSummary(
          req.body.name || series.name,
          req.body.publisher || series.publisher,
          req.body.total_volumes || series.total_volumes
        );
        
        await series.update({ summary });
        series.summary = summary;
      } catch (summaryError) {
        console.error('Error regenerating summary during update:', summaryError);
        // Continue without updating summary if generation fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('Error updating series:', error);
    next(error);
  }
};

// Delete series
exports.deleteSeries = async (req, res, next) => {
  try {
    const series = await Series.findByPk(req.params.id);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    await series.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    next(error);
  }
};