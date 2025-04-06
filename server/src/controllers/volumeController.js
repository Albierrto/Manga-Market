const { Volume, Series } = require('../models');

// Get all volumes with series info
exports.getAllVolumes = async (req, res, next) => {
  try {
    const volumes = await Volume.findAll({
      include: [{ model: Series, as: 'series', attributes: ['name', 'publisher'] }]
    });
    
    res.status(200).json({
      success: true,
      count: volumes.length,
      data: volumes
    });
  } catch (error) {
    console.error('Error fetching volumes:', error);
    next(error);
  }
};

// Get all volumes for a specific series
exports.getVolumesBySeries = async (req, res, next) => {
  try {
    const seriesId = req.params.seriesId;
    
    const volumes = await Volume.findAll({
      where: { series_id: seriesId },
      order: [['volume_number', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: volumes.length,
      data: volumes
    });
  } catch (error) {
    console.error('Error fetching volumes by series:', error);
    next(error);
  }
};

// Get single volume by ID
exports.getVolumeById = async (req, res, next) => {
  try {
    const volume = await Volume.findByPk(req.params.id, {
      include: [{ model: Series, as: 'series', attributes: ['name', 'publisher'] }]
    });
    
    if (!volume) {
      return res.status(404).json({
        success: false,
        error: 'Volume not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: volume
    });
  } catch (error) {
    console.error('Error fetching volume by ID:', error);
    next(error);
  }
};

// Create new volume
exports.createVolume = async (req, res, next) => {
  try {
    // First check if the series exists
    const series = await Series.findByPk(req.body.series_id);
    
    if (!series) {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }
    
    const volume = await Volume.create(req.body);
    
    res.status(201).json({
      success: true,
      data: volume
    });
  } catch (error) {
    console.error('Error creating volume:', error);
    next(error);
  }
};

// Update volume
exports.updateVolume = async (req, res, next) => {
  try {
    const volume = await Volume.findByPk(req.params.id);
    
    if (!volume) {
      return res.status(404).json({
        success: false,
        error: 'Volume not found'
      });
    }
    
    await volume.update(req.body);
    
    res.status(200).json({
      success: true,
      data: volume
    });
  } catch (error) {
    console.error('Error updating volume:', error);
    next(error);
  }
};

// Delete volume
exports.deleteVolume = async (req, res, next) => {
  try {
    const volume = await Volume.findByPk(req.params.id);
    
    if (!volume) {
      return res.status(404).json({
        success: false,
        error: 'Volume not found'
      });
    }
    
    await volume.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting volume:', error);
    next(error);
  }
};