const { Series } = require('../models');

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