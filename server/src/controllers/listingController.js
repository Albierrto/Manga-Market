const { Listing, Inventory, ListingInventory, Volume, Series } = require('../models');
const { Op } = require('sequelize');

// Get all listings
exports.getAllListings = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    
    const listings = await Listing.findAll({
      where: whereClause,
      include: [{
        model: Inventory,
        as: 'inventoryItems',
        include: [{
          model: Volume,
          as: 'volume',
          include: [{
            model: Series,
            as: 'series'
          }]
        }]
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    next(error);
  }
};

// Get listing by ID
exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [{
        model: Inventory,
        as: 'inventoryItems',
        include: [{
          model: Volume,
          as: 'volume',
          include: [{
            model: Series,
            as: 'series'
          }]
        }]
      }]
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    next(error);
  }
};

// Create new listing
exports.createListing = async (req, res, next) => {
  try {
    const { title, description, price, inventoryIds } = req.body;
    
    // Validate input
    if (!title || !price || !inventoryIds || !Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, price, and at least one inventory item'
      });
    }
    
    // Verify inventory items exist and are available
    const inventoryItems = await Inventory.findAll({
      where: {
        inventory_id: { [Op.in]: inventoryIds },
        status: 'in_stock'
      }
    });
    
    if (inventoryItems.length !== inventoryIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more inventory items are not available'
      });
    }
    
    // Start transaction
    const transaction = await Listing.sequelize.transaction();
    
    try {
      // Create listing
      const listing = await Listing.create({
        title,
        description,
        price,
        status: 'active'
      }, { transaction });
      
      // Associate inventory items with listing
      const listingInventoryData = inventoryIds.map(inventoryId => ({
        listing_id: listing.listing_id,
        inventory_id: inventoryId
      }));
      
      await ListingInventory.bulkCreate(listingInventoryData, { transaction });
      
      // Update inventory items status to 'listed'
      await Inventory.update(
        { status: 'listed' },
        { 
          where: { inventory_id: { [Op.in]: inventoryIds } },
          transaction
        }
      );
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch complete listing with relationships
      const newListing = await Listing.findByPk(listing.listing_id, {
        include: [{
          model: Inventory,
          as: 'inventoryItems',
          include: [{
            model: Volume,
            as: 'volume',
            include: [{
              model: Series,
              as: 'series'
            }]
          }]
        }]
      });
      
      res.status(201).json({
        success: true,
        data: newListing
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    next(error);
  }
};

// Update listing
exports.updateListing = async (req, res, next) => {
  try {
    const { title, description, price, status } = req.body;
    
    const listing = await Listing.findByPk(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Update listing
    await listing.update({
      title: title || listing.title,
      description: description || listing.description,
      price: price || listing.price,
      status: status || listing.status
    });
    
    // If listing is marked as sold, update inventory items
    if (status === 'sold' && listing.status !== 'sold') {
      const inventoryItems = await Inventory.findAll({
        include: [{
          model: Listing,
          as: 'listings',
          where: { listing_id: listing.listing_id }
        }]
      });
      
      for (const item of inventoryItems) {
        await item.update({ status: 'sold' });
      }
    }
    
    // Fetch updated listing with relationships
    const updatedListing = await Listing.findByPk(listing.listing_id, {
      include: [{
        model: Inventory,
        as: 'inventoryItems',
        include: [{
          model: Volume,
          as: 'volume',
          include: [{
            model: Series,
            as: 'series'
          }]
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      data: updatedListing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    next(error);
  }
};

// Delete listing
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByPk(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Start transaction
    const transaction = await Listing.sequelize.transaction();
    
    try {
      // Get inventory items in this listing
      const listingInventory = await ListingInventory.findAll({
        where: { listing_id: listing.listing_id },
        transaction
      });
      
      const inventoryIds = listingInventory.map(item => item.inventory_id);
      
      // Update inventory items status back to 'in_stock'
      if (inventoryIds.length > 0) {
        await Inventory.update(
          { status: 'in_stock' },
          { 
            where: { 
              inventory_id: { [Op.in]: inventoryIds },
              status: 'listed' // Only update if still listed (not sold)
            },
            transaction
          }
        );
      }
      
      // Delete listing inventory associations
      await ListingInventory.destroy({
        where: { listing_id: listing.listing_id },
        transaction
      });
      
      // Delete listing
      await listing.destroy({ transaction });
      
      // Commit transaction
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    next(error);
  }
};