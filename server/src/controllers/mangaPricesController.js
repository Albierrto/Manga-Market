const ebayService = require('../services/ebayService');

// Get prices for a manga series
exports.getMangaPrices = async (req, res) => {
  try {
    const { series, volumes, totalVolumes } = req.query;
    
    if (!series) {
      return res.status(400).json({ 
        success: false, 
        message: 'Series name is required' 
      });
    }
    
    // Get sold listings from eBay
    const searchResults = await ebayService.searchCompletedMangaSets(series, volumes);
    
    if (!searchResults.success) {
      return res.status(404).json(searchResults);
    }
    
    // Calculate price metrics
    const priceData = ebayService.calculateMangaPrices(
      searchResults.data, 
      parseInt(totalVolumes) || (volumes ? parseInt(volumes.split('-')[1]) : 1)
    );
    
    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'Could not calculate prices from available data'
      });
    }
    
    res.status(200).json({
      success: true,
      series,
      volumes,
      data: priceData
    });
    
  } catch (error) {
    console.error('Error in manga prices controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing manga prices',
      error: error.message
    });
  }
};